'use strict';

const { dirname } = require('path');
// const {
//   injectInitialization
// } = require('@babel/helper-create-class-features-plugin');

function macros(babel) {
  const { types: t } = babel;

  /**
   * Copied from `@babel/helper-create-class-features-plugin`.
   *
   * @todo Wait for a new release.
   * @see https://github.com/babel/babel/blob/b4c9cb0222e52966491226524d4e396c6b19c280/packages/babel-helper-create-class-features-plugin/src/misc.js#L49-L83
   */
  function injectInitialization(path, constructor, nodes, renamer) {
    if (!nodes.length) return;

    const isDerived = !!path.node.superClass;

    if (!constructor) {
      const newConstructor = t.classMethod(
        'constructor',
        t.identifier('constructor'),
        [],
        t.blockStatement([])
      );

      if (isDerived) {
        newConstructor.params = [t.restElement(t.identifier('args'))];
        newConstructor.body.body.push(template.statement.ast`super(...args)`);
      }

      [constructor] = path.get('body').unshiftContainer('body', newConstructor);
    }

    if (renamer) {
      renamer(referenceVisitor, { scope: constructor.scope });
    }

    if (isDerived) {
      const bareSupers = [];
      constructor.traverse(findBareSupers, bareSupers);
      for (const bareSuper of bareSupers) {
        bareSuper.insertAfter(nodes);
      }
    } else {
      constructor.get('body').unshiftContainer('body', nodes);
    }
  }

  function getDecoratorIdentifiers(decoratorsPath) {
    return decoratorsPath.map(path => path.get('expression'));
  }

  function decoratorNeedsEagerInitialization(
    identifierPath,
    { globals, imports }
  ) {
    const { name } = identifierPath.node;

    if (Array.isArray(globals) && globals.includes(name)) return true;

    const binding = identifierPath.scope.getBinding(name);

    return (
      binding &&
      binding.path.isImportSpecifier() &&
      binding.path.parent.source.value in imports &&
      imports[binding.path.parent.source.value].includes(name)
    );
  }

  function classPropertyNeedsEagerInitialization(path, opts) {
    if (!path.node.value) return false;

    if (
      !Array.isArray(path.node.decorators) ||
      path.node.decorators.length === 0
    )
      return false;

    return getDecoratorIdentifiers(path.get('decorators')).some(path =>
      decoratorNeedsEagerInitialization(path, opts)
    );
  }

  function thisAssignmentFromClassProperty(classPropertyNode) {
    return t.assignmentExpression(
      '=',
      t.memberExpression(t.thisExpression(), classPropertyNode.key),
      classPropertyNode.value
    );
  }

  return {
    name: 'babel-plugin-force-eager-initialization',
    visitor: {
      Class(path, state) {
        const body = path.get('body');

        const classPropertiesNeedingEagerInitialization = [];
        let constructor;

        for (const path of body.get('body')) {
          if (
            path.isClassProperty() &&
            classPropertyNeedsEagerInitialization(path, state.opts)
          ) {
            classPropertiesNeedingEagerInitialization.push(path);
            continue;
          }

          if (path.isClassMethod({ kind: 'constructor' })) {
            constructor = path;
            continue;
          }
        }

        if (classPropertiesNeedingEagerInitialization.length === 0) return;

        injectInitialization(
          path,
          constructor,
          classPropertiesNeedingEagerInitialization.map(path =>
            thisAssignmentFromClassProperty(path.node)
          )
        );
      }
    }
  };
}

macros.baseDir = function() {
  return dirname(__dirname);
};

module.exports = macros;
