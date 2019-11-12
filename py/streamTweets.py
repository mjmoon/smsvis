"""Stream tweets using Twitter api."""
import sys
import getopt
from datetime import datetime
import tweepy as twt
import json
import yaml as yml


class TwtStreamListener(twt.StreamListener):
    """My StreamListener class."""

    def __init__(self, file, limit=10):
        """My StreamListener class."""
        super(TwtStreamListener, self).__init__()
        self._dateFormat = '%Y-%m-%d %H:%M:%S'
        self._start_time = datetime.now()
        self._file = file + self._start_time.strftime('-%Y%m%d-%H%M%S.json')
        self._counter = 1
        self._limit = limit
        self._twt_list = []
        print(
            'Started at ' +
            self._start_time.strftime(self._dateFormat))
        with open(self._file, 'w') as f:
            f.write('{ "retrieved_at": "' +
                    self._start_time.strftime(self._dateFormat) +
                    '",\n"tweets": [')

    def on_status(self, status):
        """Print status each time."""
        if self._counter < self._limit:
            with open(self._file, "a+") as f:
                f.write(
                    json.dumps(self._map_status_fields(status)) + ',\n')
            print('Status ' + str(self._counter) +
                  ':    ' + status.text)
            self._counter += 1
        else:
            with open(self._file, "a+") as f:
                f.write(
                    json.dumps(self._map_status_fields(status)) + ']}')
            print('Status ' + str(self._counter) +
                  ':    ' + status.text)
            return False

    def on_error(self, status_code):
        """Handle error."""
        err = {
            401: 'Authentication failed.',
            403: 'Requested action is not permitted.',
            404: 'Unkonwn request/endpoint.',
            406: 'Invalid request parameter.',
            413: 'Parameter list is too long.',
            416: 'Count parameter is unacceptable.',
            420: 'Rate limit exceeded.',
            503: 'Service is temporarily unavailable.'
        }
        msg = err.get(status_code, 'Unknown error.')
        print(msg)
        with open(self._file, "a+") as f:
            f.write('] + "Error":"' + msg + '"\n}')
        return False

    def _map_status_fields(self, tweet):
        """Extract fields from status to save to json."""
        data = {
            # status
            "date": tweet.created_at.astimezone(
                tz=None).strftime('%Y-%m-%d %H:%M:%S'),
            "id": tweet.id_str,
            "text": tweet.text,
            "truncated": tweet.truncated,
            "lang": tweet.lang,
            # user
            "user_id": tweet.user.id_str,
            "user_screen_name": tweet.user.screen_name,
            "user_verified": tweet.user.verified,
            "user_lang": tweet.user.lang,
            # reply
            "reply_to_id": tweet.in_reply_to_status_id_str,
            # quote
            "quoted_id": None,
            "quoted_text": None,
            # retweet
            "retweeted_id": None,
            "retweeted_text": None
            }
        # full text
        try:
            data.update({
                "text": tweet.extended_tweet['full_text']
            })
        except AttributeError:
            pass
        # quote
        if hasattr(tweet, "quoted_status"):
            data.update({"quoted_id": tweet.quoted_status.id_str})
            try:
                data.update({
                    "quoted_text":
                    tweet.quoted_status.extended_tweet['full_text']
                })
            except AttributeError:
                data.update({
                    "quoted_text":
                    tweet.quoted_status.text
                })
        # retweet
        if hasattr(tweet, "retweeted_status"):
            data.update({"retweeted_id": tweet.retweeted_status.id})
            try:
                data.update({
                    "retweet_text":
                    tweet.retweeted_status.extended_tweet['full_text']
                })
            except AttributeError:
                data.update({
                    "retweeted_text":
                    tweet.retweeted_status.text
                })
        data.update({
            "tweet_url":
            "https://twitter.com/%s/status/%s" %
            (tweet.user.screen_name, tweet.id_str)
        })
        return(data)


def main(argv):
    """Run from commandline."""
    try:
        opts, args = getopt.getopt(argv, 'n', ['number'])
    except getopt.GetoptError as err:
        print(err)
        print('streamTweets.py -n <number-of-tweets>')
        sys.exit(2)
    limit = 10
    for opt, arg in opts:
        if opt == '-n':
            try:
                limit = int(arg)
            except TypeError as err:
                print(err)
                print('Number of tweets must be a integer.')
                sys.exit(2)
        else:
            assert False, "Unhandled option."
    # authorize Twitter API
    with open('ACCESS.yml', 'r') as file:
        acs = yml.load(file, yml.Loader)
    auth = twt.OAuthHandler(acs['api_key'], acs['api_secret'])
    auth.set_access_token(acs['access_token'], acs['access_seret'])
    api = twt.API(auth)
    # open stream listener
    streamListener = TwtStreamListener(
        'data/streamClimateChange/climate_change', limit)
    stream = twt.Stream(auth=api.auth, listener=streamListener)
    # start streaming
    stream.filter(track=['climate change'])
    # finished
    print('Completed at ' + datetime.now().strftime('%Y-%m-%d %H:%M:%S'))


if __name__ == '__main__':
    main(sys.argv[1:])
