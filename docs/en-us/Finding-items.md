## find
Find records with matching criteria, can be chained (see below):
```javascript
Person.find({status:'active'}, function(err, results) {
  // ...
});
```

You can limit your results as well. This limits our results to 10
```javascript
Person.find({status:'active'}, 10, function(err, results) {
  // ...
});
```

`Person.all` is an alias to `Person.find`

## get
Find record by primary key.
```javascript
Person.get(1, function(err, person) {
  // ...
});
```
## one
Find one record with similar syntax to find.
```javascript
Person.one({status:'active'}, function(err, person) {
  // ...
});
```

## count
Get the number of matching records.
```javascript
Person.count({status:'active'}, function(err, activePeopleCount) {
  // ...
});
```

## exists
Test a record matching your conditions exists.
```javascript
Person.exists({id:1, status:'active'}, function(err, personIsActive) {
  // ...
});
```

## Filtering and sorting
We accept 2 objects to perform filtering (first) and aggregate (second). The aggregate object accepts `limit`, `order`, and `groupBy`.

https://github.com/dresende/node-orm2/blob/v2.1.20/lib/AggregateFunctions.js#L36

```javascript
Person.find({status:'active'}, {limit:10}, function(err, res) {
  // res is Person where col1 == 1 or col2 == 2
});
```

## Conditions for find/count/one etc.
All comma separated key/values are AND'd together in the query. You may prefix a set of conditions with logical operators.
```
Person.find({or:[{col1: 1}, {col2: 2}]}, function(err, res) {
  // res is Person where col1 == 1 or col2 == 2
});
```

## Finding with an `IN`
`sql-query` (underlying SQL engine) will automatically coerce any array to an `IN` based query.

https://github.com/dresende/node-sql-query/blob/v0.1.23/lib/Where.js#L172

```javascript
Person.find({id: [1, 2]}, function(err, persons) {
  // Finds people with id's 1 and 2 (e.g. `WHERE id IN (1, 2)`)
});
```