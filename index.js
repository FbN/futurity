import type from 'sanctuary-type-identifiers'
import * as F from 'fluture'
import Monet from 'monet'
const { Future } = F
const { Reader } = Monet

const I = v => v

const future = ({ _fT }) =>
    F.isFuture(_fT) ? _fT : _fT[2].run(_fT[1].run(_fT[0](undefined)))

const chain = pred => ({ _fT }) => pred(_fT)

const coMap = pred => ft =>
    F.isFuture(ft._fT)
        ? ft
        : Futurity([
            ft._fT[0],
            ft._fT[1].flatMap(computed => Reader(e => pred(computed, e))),
            ft._fT[2]
        ])

const envMap = pred => ft =>
    F.isFuture(ft._fT)
        ? ft
        : Futurity([e => pred(ft._fT[0](e)), ft._fT[1], ft._fT[2]])

const toString = ({ _fT }) => {
    if (!F.isFuture(_fT)) {
        return 'Futurity: [\n    ' + _fT.toStgring() + ']'
    }
    const e = _fT[0]()
    const a = _fT[1].run(e)
    const b = _fT[2].run(a)
    return (
        'Futurity: [\n    ' +
        JSON.stringify(e) +
        ',\n    ' +
        a.toString() +
        ',\n    ' +
        b['@@show']() +
        ']'
    )
}

export var $$type = 'fluture/Futurity@5'

function Futurity (_fT) {
    return Object.create(Futurity.prototype, {
        _fT: {
            value: _fT,
            writable: false,
            enumerable: true,
            configurable: true
        }
    })
}

const isFuturity = x => x instanceof Futurity || type(x) === $$type

const prototype = {
    name: 'Futurity',
    '@@type': $$type,
    arity: 1,
    _interpret: function (rec, rej, res) {
        return future(this)._interpret(rec, rej, res)
    },
    _transform: function (transformation) {
        return chain(_fT =>
            Futurity(
                F.isFuture(_fT)
                    ? _fT._transform(transformation)
                    : [
                        _fT[0],
                        _fT[1],
                        _fT[2].map(f => f._transform(transformation))
                    ]
            )
        )(this)
    },
    extractLeft: function Futurity$extractLeft () {
        return F.isFuture(this._fT) ? this._fT.extractLeft() : []
    },
    extractRight: function Futurity$extractRight () {
        return F.isFuture(this._fT) ? this._fT.extractRight() : []
    }
}

Futurity.prototype = Object.create(Future.prototype, {
    ...Object.getOwnPropertyDescriptors(prototype),
    constructor: {
        value: Futurity,
        enumerable: false,
        writable: true
    }
})

Futurity['@@type'] = $$type

Futurity.lift = (computation, computationToFluture) =>
    Futurity([I, Reader(computation), Reader(computationToFluture)])

Futurity.ask = Reader

const resolve = v => Futurity(F.resolve(v))
const reject = v => Futurity(F.reject(v))

const rejectAfter = t => v => Futurity.lift(() => v, F.rejectAfter(t))

Futurity['fantasy-land/of'] = resolve

function Next (x) {
    return { done: false, value: x }
}

function Done (x) {
    return { done: true, value: x }
}

function chainRec (step, init) {
    return Futurity(
        F.Future['fantasy-land/chainRec']((n, d, v) => step(n, d, v)._fT, init)
    )
}

Futurity['fantasy-land/chainRec'] = chainRec

export {
    F,
    Futurity,
    future,
    chain,
    coMap,
    envMap,
    isFuturity,
    resolve,
    reject,
    rejectAfter
}
