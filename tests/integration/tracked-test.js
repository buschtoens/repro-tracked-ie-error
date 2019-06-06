import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, settled } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import { tracked } from '@glimmer/tracking';

module('Integration | @tracked', function(hooks) {
  setupRenderingTest(hooks);

  test('it re-renders, when the value is mutated', async function(assert) {
    class Subject {
      @tracked
      initializedProp = 'foo';

      @tracked
      uninitializedProp;
    }

    this.subject = new Subject();

    await render(hbs`
      initializedProp = {{this.subject.initializedProp}};
      uninitializedProp = {{this.subject.uninitializedProp}};
    `);

    // Only this first assertion fails in IE11, the rest passes.
    assert.ok(this.element.textContent.includes('initializedProp = foo;'));
    assert.ok(this.element.textContent.includes('uninitializedProp = ;'));

    this.subject.initializedProp = 'bar';
    await settled();

    assert.ok(this.element.textContent.includes('initializedProp = bar;'));
    assert.ok(this.element.textContent.includes('uninitializedProp = ;'));

    this.subject.uninitializedProp = 'qux';
    await settled();

    assert.ok(this.element.textContent.includes('initializedProp = bar;'));
    assert.ok(this.element.textContent.includes('uninitializedProp = qux;'));
  });
});
