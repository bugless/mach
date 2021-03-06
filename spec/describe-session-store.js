require('./helper');
module.exports = describeSessionStore;

function describeSessionStore(store, skip) {
  if (!skip) {
    beforeEach(function () {
      if (typeof store.purge === 'function')
        return store.purge();
    });

    after(function () {
      if (typeof store.destroy === 'function')
        return store.destroy();
    });
  }

  var desc = skip ? describe.skip : describe;

  desc('when there is no session with a given value', function () {
    var session;
    beforeEach(function () {
      return store.load('fake-value').then(function (newSession) {
        session = newSession;
      });
    });

    it('returns an empty object', function () {
      expect(session).toEqual({});
    });
  });

  desc('when a session is saved', function () {
    var value;
    beforeEach(function () {
      var session = { count: 1 };
      return store.save(session).then(function (newValue) {
        value = newValue;
      });
    });

    it('can be retrieved using the opaque return value', function () {
      return store.load(value).then(function (session) {
        assert(session);
        expect(session.count).toEqual(1);
      });
    });
  });

  desc('when it has a TTL', function () {
    beforeEach(function () {
      store._ttl = 10;
    });

    afterEach(function () {
      delete store._ttl;
    });

    describe('and a session is not expired', function () {
      var value;
      beforeEach(function () {
        var session = { count: 1 };
        return store.save(session).then(function (newValue) {
          value = newValue;
        });
      });

      it('loads the session', function () {
        return store.load(value).then(function (session) {
          assert(session);
          expect(session.count).toEqual(1);
        });
      });
    });

    describe('and a session is expired', function () {
      var value;
      beforeEach(function () {
        var session = { count: 1 };
        return store.save(session).then(function (newValue) {
          value = newValue;
          return delay(store._ttl);
        });
      });

      it('loads a new session', function () {
        return store.load(value).then(function (session) {
          assert(session);
          expect(session).toEqual({});
        });
      });
    });

    describe('and a session is saved before it expires', function () {
      var value;
      beforeEach(function () {
        var session = { count: 1 };
        return store.save(session).then(function () {
          return delay(store._ttl / 2).then(function () {
            return store.save(session).then(function (newValue) {
              value = newValue;
              return delay(store._ttl / 2);
            });
          });
        });
      });

      it('loads the session', function () {
        return store.load(value).then(function (session) {
          assert(session);
          expect(session.count).toEqual(1);
        });
      });
    });
  });
}

var RSVP = require('rsvp');

function delay(ms) {
  var deferred = RSVP.defer();
  setTimeout(deferred.resolve, ms);
  return deferred.promise;
}
