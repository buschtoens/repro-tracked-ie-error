import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { tracked } from '@glimmer/tracking';

module('Unit | @tracked', function(hooks) {
  setupTest(hooks);

  test('it applys the initializer', function(assert) {
    class Subject {
      @tracked
      property = 'foo';
    }

    const subject = new Subject();

    assert.strictEqual(subject.property, 'foo');
  });
});
