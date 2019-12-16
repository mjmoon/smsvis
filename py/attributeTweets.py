"""Add attributes to tweet texts and graphs."""
import sys
import getopt
from datetime import datetime
import os
import re
import json
import pandas as pd
import preprocessor as p
from nltk import corpus
from nltk import tokenize as tk
from nltk import stem
from nltk.tag import pos_tag
from nltk.sentiment import vader
import gensim
import networkx as nx
# from networkx.algorithms.community.centrality import girvan_newman

OUT_COLUMNS_TWT = [
    'id', 'date', 'text', 'user_id', 'user_screen_name',
    'user_verified', 'quoted_text', 'tweet_url',
    'polarity', 'topics']


class AttributeTwt():
    """Class for handling tweet attributes."""

    def __init__(self, tweets, sid, stopwords):
        """Class for handling tweet attributes."""
        self._sid = sid
        # tweet texts
        self._tweets = [
            self._clean_tweets(x) for x in tweets['text']]
        self._retweets = [
            self._clean_tweets(x) for x in tweets['retweeted_text']]
        self._quotes = [
            self._clean_tweets(x) for x in tweets['quoted_text']]
        # for LDA topic model
        self._stopwords = stopwords
        self._corpus = None
        self._id2word = None
        self._lda_model = None
        self._coherence_model = None
        self._lda_coherence = None
        # graph
        if 'id' not in tweets.columns:
            tweets = tweets.reset_index().rename(columns={'index': 'id'})
        self._graph = nx.from_pandas_edgelist(
            self._get_tweet_edges(tweets), create_using=nx.DiGraph(),
            source='id', target='target_id', edge_attr='type')
        # self._centralities = self._get_centralities(tweets)

    def _clean_tweets(self, tweet):
        """Preprocess tweets."""
        if tweet is None:
            return None
        tweet = p.clean(tweet)
        # after tweepy preprocessing the colon symbol left remain after
        # removing mentions
        tweet = re.sub(r':', '', tweet)
        return tweet

    def _score_sentiment(self, tweet):
        """Return a polarity score using VADER."""
        score = self._sid.polarity_scores(tweet)
        return(score['compound'])

    def score_sentiments(self):
        """Return polarity scores using VADER."""
        scores = [self._score_sentiment(x) for x in self._tweets]
        return scores

    def _prepare_topic_corpus(self):
        """Prepare the dictionary and the corpus for the LDA topic model."""
        # remove None and tokenize
        tweets = list(filter(None, self._tweets))
        tokens = list(self._tokenize(tweets))
        # remove stopwords
        tokens = [
            [word.lower() for word in twt
             if word.lower() not in self._stopwords]
            for twt in tokens
        ]
        # create bigrams
        bigram = gensim.models.Phrases(
            tokens, min_count=5, threshold=100)
        bigram_mod = gensim.models.phrases.Phraser(bigram)
        tokens_bigram = [bigram_mod[twt] for twt in tokens]
        # lemmatize
        self._tokens_lemmatized = [
            list(self._lemmatize(twt)) for twt in tokens_bigram
        ]
        # create the dictionary and corpus for modelling
        self._id2word = gensim.corpora.Dictionary(self._tokens_lemmatized)
        self._corpus = [
            self._id2word.doc2bow(text) for text in self._tokens_lemmatized]

    def _tokenize(self, tweets):
        """Tokenize words only."""
        tokenizer = tk.RegexpTokenizer(r'\w+')
        for twt in tweets:
            yield tokenizer.tokenize(twt)

    def _lemmatize(self, tweet):
        """Lemmatize words."""
        lemmatizer = stem.WordNetLemmatizer()
        for word, tag in pos_tag(tweet):
            if tag.startswith('NN'):
                yield lemmatizer.lemmatize(word, pos='n')
            elif tag.startswith('VB'):
                yield lemmatizer.lemmatize(word, pos='v')
            elif tag.startswith('JJ'):
                yield lemmatizer.lemmatize(word, pos='a')
            else:
                yield word

    def model_topics(self, num_topics=5, chunksize=2000, random_state=None):
        """Build a LDA topic model."""
        self._prepare_topic_corpus()
        self._lda_model = gensim.models.ldamodel.LdaModel(
            corpus=self._corpus,
            id2word=self._id2word,
            num_topics=num_topics,
            alpha='auto',
            chunksize=chunksize,
            random_state=random_state
        )
        self._lda_coherence = None

    def _compute_coherence(self, coherence='c_v'):
        """Compute coherence score."""
        # for quick sanity check
        self._coherence_model = gensim.models.CoherenceModel(
            model=self._lda_model,
            texts=self._tokens_lemmatized,
            dictionary=self._id2word,
            coherence=coherence
        )
        self._lda_coherence = self._coherence_model.get_coherence()

    def get_coherence(self, coherence='c_v'):
        """Return coherence score."""
        # for quick sanity check
        if self._lda_coherence is None:
            self._compute_coherence(coherence)
        return self._lda_coherence

    def get_topics(self):
        """Return dominant topics for each tweet."""
        dominant_topics = list()
        for ind, row in enumerate(self._lda_model[self._corpus]):
            top = sorted(row, key=lambda x: (x[1]), reverse=True)[0]
            topic_dist = self._lda_model.show_topic(top[0])
            topic_keywords = ','.join([word for word, prop in topic_dist])
            dominant_topics.append(topic_keywords)
        return dominant_topics

    def _get_tweet_edges(self, data):
        """Return an edge list for internal use."""
        # create an edge list to greate a graph object
        edges = pd.melt(
            data, id_vars=['id'],
            value_vars=['retweeted_id', 'quoted_id', 'reply_to_id']
            ).dropna().rename(columns={
                'variable': 'type',
                'value': 'target_id'
            })
        edges['type'] = [x.split('_')[0] for x in edges['type']]
        return edges

    def _edge_dict_to_list(self, edge_dict):
        """Expand edge dict output to list of dicts."""
        for id, targets in edge_dict.items():
            for t_id, t_type in targets.items():
                yield {"id": id, "target": t_id, "type": t_type['type']}

    def get_tweet_edges(self):
        """Return an edge list to save to json."""
        edges_dict = nx.to_dict_of_dicts(self._graph)
        edges_list = list(self._edge_dict_to_list(edges_dict))
        return edges_list

    def _get_centralities(self, tweets):
        """Return in-degree and betweeness centralities."""
        out = tweets[['id']]
        in_degree = nx.in_degree_centrality(self._graph)
        in_degree = pd.Series(in_degree).rename(
            'in_degree_centrality') * len(self._graph)
        out = out.set_index('id').join(
            in_degree.round()).fillna(0)
        return out

    def get_centralities(self):
        """Return in degree centrality scores."""
        return self._centralities


def main(argv):
    """Run from commandline."""
    try:
        opts, args = getopt.getopt(argv, 'f:k:', ['file_path=', 'keywords='])
    except getopt.GetoptError as err:
        print(err)
        print('attributeTweets.py -n <number-of-tweets> -k <keywords>')
        sys.exit(2)
    # default parameters
    file_path = os.path.join(
        'data/streamOut', os.listdir('data/streamOut').pop(-1))
    keywords = ['climate', 'change']
    for opt, arg in opts:
        if opt in ('-f', '--file_path'):
            file_path = arg
            if not os.path.isfile(file_path):
                raise Exception('File does not exist at {}'.format(arg))
        elif opt in ('-k', '--keywords'):
            try:
                keywords = arg.replace(' ', ',').split(',')
            except ValueError as err:
                print(err)
                sys.exit(1)
        else:
            assert False, "Unhandled option."

    save_to_file = '-'.join(keywords) + '_' + datetime.now().strftime(
        '%Y-%m-%d-%H-%M')
    print(datetime.now().strftime('%Y-%m-%d %H:%M:%S') + ': Process started.')
    p.set_options(p.OPT.URL, p.OPT.RESERVED, p.OPT.MENTION)
    sid = vader.SentimentIntensityAnalyzer()
    stopwords = corpus.stopwords.words('english')
    stopwords.extend(['from', 'subject', 're', 'edu', 'use'])
    # exclude the search term from the topic model
    stopwords.extend(keywords)

    # load file
    print(datetime.now().strftime('%Y-%m-%d %H:%M:%S') + ': Loading data.')
    with open(file_path, 'r') as file:
        json_data = json.load(file)
        data = pd.DataFrame(json_data['tweets']).set_index('id')
    attrTwt = AttributeTwt(data, sid, stopwords)
    edges = attrTwt.get_tweet_edges()

    # sentiment polarity
    print(
        datetime.now().strftime('%Y-%m-%d %H:%M:%S') +
        ': Computing the polarity scores.')
    data['polarity'] = attrTwt.score_sentiments()

    # topic modelling
    print(
        datetime.now().strftime('%Y-%m-%d %H:%M:%S') +
        ': Computing the subtopics.')
    attrTwt.model_topics()
    coherence = attrTwt.get_coherence(coherence='c_v')
    print(
        ''.rjust(21) + 'Coherence score: {:.4f}'.format(coherence))
    data['topics'] = attrTwt.get_topics()

    # write outputs
    print(
        datetime.now().strftime('%Y-%m-%d %H:%M:%S') +
        ': Saving outputs.')
    data_out = data.reset_index().rename(
        columns={'index': 'id'})[OUT_COLUMNS_TWT]
    with open('data/nodes_' + save_to_file + '.json', 'w') as f:
        data_out.to_json(f, orient='records')
    with open('data/edges_' + save_to_file + '.json', 'w') as f:
        json.dump(edges, f)

    print(
        datetime.now().strftime('%Y-%m-%d %H:%M:%S') + ': Process completed.')


if __name__ == '__main__':
    main(sys.argv[1:])
