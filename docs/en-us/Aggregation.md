If you need to get some aggregated values from a Model, you can use `Model.aggregate()`. Here's an example to better
illustrate:

```js
Person.aggregate({ surname: "Doe" }).min("age").max("age").get(function (err, min, max) {
	console.log("The youngest Doe guy has %d years, while the oldest is %d", min, max);
});
```

An `Array` of properties can be passed to select only a few properties. An `Object` is also accepted to define conditions.

Here's an example to illustrate how to use `.groupBy()`:

```js
//The same as "select avg(weight), age from person where country='someCountry' group by age;"
Person.aggregate(["age"], { country: "someCountry" }).avg("weight").groupBy("age").get(function (err, stats) {
    // stats is an Array, each item should have 'age' and 'avg_weight'
});
```

### Base `.aggregate()` methods

- `.limit()`: you can pass a number as a limit, or two numbers as offset and limit respectively
- `.order()`: same as `Model.find().order()`

### Additional `.aggregate()` methods

- `min`
- `max`
- `avg`
- `sum`
- `count` (there's a shortcut to this - `Model.count`)

There are more aggregate functions depending on the driver (Math functions for example).