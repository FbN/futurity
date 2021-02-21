import type from 'sanctuary-type-identifiers'
import show from 'sanctuary-show'
import jsc from 'jsverify'

import { ordinal } from './const.js'
import { eq, error, throws, test } from './util.js'
import {
    any,
    anyFuture,
    anyNonFuture,
    anyParallel,
    anyFunction,
    anyResolvedFuture,
    FutureArb
} from './arbitraries.js'

export * from './arbitraries.js'

export var array = jsc.array
export var nearray = jsc.nearray
export var bool = jsc.bool
export var constant = jsc.constant
export var falsy = jsc.falsy
export var fn = jsc.fn
export var letrec = jsc.letrec
export var nat = jsc.nat
export var number = jsc.number
export var oneof = jsc.oneof
export var string = jsc.string
export var elements = jsc.elements
export var suchthat = jsc.suchthat

export function _of (rarb) {
    return FutureArb(string, rarb)
}

export function property (name) {
    const args = Array.from(arguments).slice(1)
    test(name, () => {
        return jsc.assert(jsc.forall.apply(null, args))
    })
}

export function f (x) {
    return { f: x }
}

export function g (x) {
    return { g: x }
}

export var altArg = {
    name: 'have Alt implemented',
    valid: anyFuture,
    invalid: anyNonFuture
}

export var applyArg = {
    name: 'have Apply implemented',
    valid: anyFuture,
    invalid: anyNonFuture
}

export var bifunctorArg = {
    name: 'have Bifunctor implemented',
    valid: anyFuture,
    invalid: anyNonFuture
}

export var chainArg = {
    name: 'have Chain implemented',
    valid: anyFuture,
    invalid: anyNonFuture
}

export var functorArg = {
    name: 'have Functor implemented',
    valid: anyFuture,
    invalid: anyNonFuture
}

export var functionArg = {
    name: 'be a Function',
    valid: anyFunction,
    invalid: oneof(number, string, bool, falsy, constant(error))
}

export var futureArg = {
    name: 'be a valid Future',
    valid: anyFuture,
    invalid: anyNonFuture
}

export var resolvedFutureArg = {
    name: 'be a valid Future',
    valid: anyResolvedFuture,
    invalid: anyNonFuture
}

export var positiveIntegerArg = {
    name: 'be a positive Integer',
    valid: suchthat(nat, function (x) {
        return x > 0
    }),
    invalid: oneof(bool, constant(0.5))
}

export var futureArrayArg = {
    name: 'be an Array of valid Futures',
    valid: array(anyFuture),
    invalid: oneof(nearray(anyNonFuture), any)
}

export var parallelArg = {
    name: 'be a ConcurrentFuture',
    valid: anyParallel,
    invalid: any
}

export var anyArg = {
    name: 'be anything',
    valid: any,
    invalid: null
}

const getValid = function (x) {
    return x.valid
}
const generateValid = function (x) {
    return getValid(x).generator(1)
}

const capply = function (f, args) {
    return args.reduce(function (g, x) {
        return g(x)
    }, f)
}

export function testFunction (name, func, args, assert) {
    const validArbs = args.map(getValid)
    const validArgs = args.map(generateValid)

    test('is a curried ' + args.length + '-ary function', function () {
        eq(typeof func, 'function')
        eq(func.length, 1)
        validArgs.slice(0, -1).forEach(function (_, idx) {
            const partial = capply(func, validArgs.slice(0, idx + 1))
            eq(typeof partial, 'function')
            eq(partial.length, 1)
        })
    })

    args.forEach(function (arg, idx) {
        const priorArgs = args.slice(0, idx)
        const followingArgs = args.slice(idx + 1)
        const validPriorArgs = priorArgs.map(generateValid)
        const validFollowingArgs = followingArgs.map(generateValid)
        if (arg !== anyArg) {
            property(
                'throws when the ' + ordinal[idx] + ' argument is invalid',
                arg.invalid,
                function (value) {
                    throws(function () {
                        capply(
                            func,
                            validPriorArgs
                                .concat([value])
                                .concat(validFollowingArgs)
                        )
                    }, new TypeError(
                        name +
                            '() expects its ' +
                            ordinal[idx] +
                            ' argument to ' +
                            arg.name +
                            '.\n' +
                            '  Actual: ' +
                            show(value) +
                            ' :: ' +
                            type.parse(type(value)).name
                    ))
                    return true
                }
            )
            property(
                'throws when the ' +
                    ordinal[idx] +
                    ' invocation has more than one argument',
                arg.valid,
                function (value) {
                    throws(function () {
                        const partial = capply(func, validPriorArgs)
                        partial(value, 42)
                    }, new TypeError(
                        name +
                            '() expects to be called with a single argument per invocation\n' +
                            '  Saw: 2 arguments\n' +
                            '  First: ' +
                            show(value) +
                            ' :: ' +
                            type.parse(type(value)).name +
                            '\n' +
                            '  Second: 42 :: Number'
                    ))
                    return true
                }
            )
        }
    })

    property.apply(
        null,
        ['returns valid output when given valid input']
            .concat(validArbs)
            .concat([
                function () {
                    return assert(capply(func, Array.from(arguments)))
                }
            ])
    )
}
