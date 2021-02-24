
<!-- PROJECT LOGO -->
<br />
<p align="center">
  <a href="https://github.com/FbN/futurity">
    <img src="images/logo.png" alt="FUTURITY" width="400">
  </a>

  <h3 align="center">Swiss Army Knife <strong>Fluture Based</strong> Data Structure</h3>

  <p align="center">
    Powered by
    <a href="https://github.com/fluture-js/Fluture">
        <img src="https://github.com/fluture-js/Fluture/raw/master/logo.png" alt="Fluture" height="40" style="vertical-align: baseline"/>
    </a>
  </p>

  <p align="center">
    <a href="https://github.com/fantasyland/fantasy-land">
        <img src="https://github.com/fantasyland/fantasy-land/raw/master/logo.png" alt="Fluture" height="40" style="vertical-align: baseline"/>
    </a>
    Implements Fantasy Land:<br /><strong>Functor</strong>, <strong>Bifunctor</strong>,
    <strong>Apply</strong>, <strong>Applicative</strong>, <strong>Chain</strong>,
    <strong>Monad</strong>
  </p>
</p>



<!-- TABLE OF CONTENTS -->
## Table of Contents

* [About the Project](#about-the-project)
  * [Built With](#built-with)
* [Getting Started](#getting-started)
  * [Installation](#installation)
* [Usage](#usage)
* [API Documentation](#API)
* [License](#license)
* [Contact](#contact)


<!-- ABOUT THE PROJECT -->
## About The Project

This data structure is a wrapper for reuse everyday mutable and effectfull promise based libs in a functional monadic future based fashion.

If Fluture moand wraps a computation that async resolve to a value, Futurity brigs tree data structures:
* Reader e -> a : [Reader monad](https://github.com/monet/monet.js/blob/master/docs/READER.md) used to lazy wrap a mutable effectfull lib (like knex or superagent for example).

    > Is a lazy Product Type that enables the composition of computations that depend on a shared > environment (e -> a). The left portion, the e must be fixed to a type for all related computations. The right portion a can vary in its type.
    -- <cite>[Crocks Dev](https://crocks.dev/docs/crocks/Reader.html)</cite>

* e -> e : Environment reducer function, used to transforms environment before run it in the computation Reader.

* Reader a -> Future b : A lazy structure (another Reader Monad) that takes the result value of the collapsing of first reader monad as environment and return a Future instance.
All fluture operators (map, chain, ap...) applied to the data structure transforms the yet to exists future instace wrapped by the this monad.

### Built With
Futurity is implemented in a few lines of code that mix up some good libraries:
* [Fluture](https://github.com/fluture-js/Fluture)
* [Monet.js](https://monet.github.io/monet.js/)

<!-- GETTING STARTED -->
## Getting Started

### Installation

1. Add Futurity to your project

  ```sh
  yarn add futurity
  ```
2. If not already in your project add peer dependencies

    ```sh
    yarn add fluture
    ```

<!-- USAGE EXAMPLES -->
## Usage

You can look in tests for other examples.

Sample of knex wrapping.

```js
import Knex from 'knex'
import { Futurity, coMap, envMap } from 'futurity'
import * as F from 'fluture'

const I = a => a
const pipe = (...args) => args.reduce((f, g) => x => g(f(x)))

const db = Knex({
    client: 'sqlite3',
    connection: {
        filename: 'tests/chinook.sqlite'
    },
    useNullAsDefault: true
})

// Futurity that wrap knex instance
const DbFuturity = (db, args) =>
    Futurity.lift(
        p => db(...args),
        qb => F.attemptP(() => qb)
    )

const query = pipe(
    coMap(qb => qb.where({ Composer: 'Nirvana' })),
    coMap(qb => qb.limit(2)),
    F.map(rows => rows.map(track => track.Name))
)(DbFuturity(db, ['Track']))

(async function(){
    const value = await F.promise(query)
    console.log(value)
})()
```

Output:
```js
['Aneurysm', 'Smells Like Teen Spirit']
```
Sample of superagent wrapping
```js
import request from 'superagent'
import { Futurity, coMap, envMap } from 'futurity'
import * as F from 'fluture'

const I = a => a
const pipe = (...args) => args.reduce((f, g) => x => g(f(x)))

// Futurity that wrap Superagent instance
const SaFuturity = method =>
    Futurity.lift(request[method], agent => F.attemptP(() => agent))

const query = pipe(
    envMap(() => 'https://jsonplaceholder.typicode.com/todos/1'),
    F.map(res => res.body),
    F.map(body => body.title),
    coMap(req => req.set('accept', 'json'))
)(SaFuturity('get'))

(async function(){
    const title = await F.promise(query)
    console.log(title)
})()
```

Output:
```js
'delectus aut autem'
```


<!-- ROADMAP -->
## API

The data structure is a Fluture extension (so you can directly use all [Fluture operators and API]([Knex](http://knexjs.org/))).

Exception for cache and hooks not yet implemented (but you can collapse a Futurity instance to a Fluture instance at you occorence).

In addition to standard Fluture functions we have:

### Factories
- [`lift`](#lift)

### Operators
- [`envMap`](#envMap)
- [`coMap`](#coMap)

### Consuming / Collapsing Operators
- [`future`](#future)

## Factories

### <a id="lift"></a> `lift(computation: e -> a, computationToFuture: a -> Future b)`

Contruct a new Futurity Instance, environment is intialized to identity function.

#### Arguments:

- `computation: e -> a` Function that takes the environment and return the target value.

- `computationToFuture: a -> Future b` Function that takes the computation result and transform it to a future.

Returns:  **Futurity Instance**

## Operators

### <a id="envMap"></a> `envMap(e -> e)`

Environment reducer. Function to transform the initial environment.

#### Arguments:

- `pred: e -> e` Function that has the current environment as input and return the new environment.

Returns:  **Futurity Instance**
- - -

### <a id="coMap"></a> `coMap((a, e) -> a)`

Function to transform the wrapped effectfull object.

#### Arguments:

- `(a, e) -> a` For your confort the environment is passed as second argumet so you can you it.

Returns:  **Futurity Instance**
- - -

## Consuming / Collapsing Operators

### <a id="future"></a> `future(fty)`

Make the futurity instance collapse to a Future instance (not yet resolved).

#### Arguments:

- `fty` Futurity instance.

Returns:  **Future Instance**
- - -
<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE` for more information.


<!-- CONTACT -->
## Contact

Fabiano Taioli - ftaioli@gmail.com

Project Link: [https://github.com/FbN/futurity](https://github.com/FbN/futurity)


<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[contributors-shield]: https://img.shields.io/github/contributors/FbN/futurity.svg?style=flat-square
[contributors-url]: https://github.com/FbN/futurity/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/FbN/futurity.svg?style=flat-square
[forks-url]: https://github.com/FbN/futurity/network/members
[stars-shield]: https://img.shields.io/github/stars/FbN/futurity.svg?style=flat-square
[stars-url]: https://github.com/FbN/futurity/stargazers
[issues-shield]: https://img.shields.io/github/issues/FbN/futurity.svg?style=flat-square
[issues-url]: https://github.com/FbN/futurity/issues
[license-shield]: https://img.shields.io/github/license/FbN/futurity.svg?style=flat-square
[license-url]: https://github.com/FbN/futurity/blob/master/LICENSE.txt
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=flat-square&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/fabiano-taioli-42917723
