import FL from 'fantasy-laws'
import Z from 'sanctuary-type-classes'
import show from 'sanctuary-show'
import { Futurity, F } from '../../index.js'
import {
    assertEqual as eq,
    I,
    B,
    T,
    K,
    noop,
    STACKSIZE,
    test
} from '../util/util.js'
import {
    FutureArb,
    _of,
    any as _x,
    anyFuture as _mx,
    constant as _k,
    elements,
    f,
    g,
    nat,
    property,
    suchthat
} from '../util/props.js'

const { bimap } = F
const of = function (x) {
    return Z.of(Futurity, x)
}

const _f = elements([f, g, I, of])
const _mf = _of(_f)
const _fm = FutureArb(_f, _f).smap(
    function (m) {
        return function (x) {
            return bimap(T(x))(T(x))(m)
        }
    },
    function (f) {
        return bimap(K)(K)(f())
    },
    show
)

function testLaw (laws, typeclass, name) {
    const args = Array.from(arguments).slice(3)
    test(`${typeclass} ${name}`, laws[name].apply(null, args))
}

testLaw(FL.Functor(eq), 'Functor', 'identity', _mx)
testLaw(FL.Functor(eq), 'Functor', 'composition', _mx, _f, _f)

testLaw(FL.Alt(eq), 'Alt', 'associativity', _mx, _mx, _mx)
testLaw(FL.Alt(eq), 'Alt', 'distributivity', _mx, _mx, _f)

testLaw(FL.Bifunctor(eq), 'Bifunctor', 'identity', _mx)
testLaw(FL.Bifunctor(eq), 'Bifunctor', 'composition', _mx, _f, _f, _f, _f)

testLaw(FL.Apply(eq), 'Apply', 'composition', _mf, _mf, _mx)

testLaw(FL.Applicative(eq, Futurity), 'Applicative', 'identity', _mx)
testLaw(FL.Applicative(eq, Futurity), 'Applicative', 'homomorphism', _f, _x)
testLaw(FL.Applicative(eq, Futurity), 'Applicative', 'interchange', _mf, _x)

testLaw(FL.Chain(eq), 'Chain', 'associativity', _mx, _fm, _fm)

testLaw(
    FL.ChainRec(eq, Futurity),
    'ChainRec',
    'equivalence',
    _k(function (v) {
        return v < 1
    }),
    _k(
        B(of)(function (v) {
            return v - 1
        })
    ),
    _k(of),
    suchthat(nat, function (x) {
        return x < 100
    })
)

test('ChainRec stack-safety', function () {
    const p = function (v) {
        return v > STACKSIZE + 1
    }
    const d = of
    const n = B(of)(function (v) {
        return v + 1
    })
    const a = Z.chainRec(
        Futurity,
        function (l, r, v) {
            return p(v) ? Z.map(r, d(v)) : Z.map(l, n(v))
        },
        0
    )
    a._interpret(noop, noop, noop)
})

testLaw(FL.Monad(eq, Futurity), 'Monad', 'leftIdentity', _fm, _mx)
testLaw(FL.Monad(eq, Futurity), 'Monad', 'rightIdentity', _mx)

property('map derived from ap and of', _mx, _f, function (m, f) {
    return eq(Z.map(f, m), Z.ap(of(f), m))
})

property('map derived from chain and of', _mx, _f, function (m, f) {
    return eq(Z.map(f, m), Z.chain(B(of)(f), m))
})

property('map derived from bimap', _mx, _f, function (m, f) {
    return eq(Z.map(f, m), Z.bimap(I, f, m))
})

property('ap derived from chain and map', _mx, _mf, function (mx, mf) {
    return eq(
        Z.ap(mf, mx),
        Z.chain(function (f) {
            return Z.map(f, mx)
        }, mf)
    )
})
