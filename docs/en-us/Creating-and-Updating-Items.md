## create
```js
var newRecord = {};
newRecord.id = 1;
newRecord.name = "John";
Person.create(newRecord, function(err, results) {
 ...
});
```

## save
```js
    Person.find({ surname: "Doe" }, function (err, people) {
        // SQL: "SELECT * FROM person WHERE surname = 'Doe'"

        console.log("People found: %d", people.length);
        console.log("First person: %s, age %d", people[0].fullName(), people[0].age);

        people[0].age = 16;
        people[0].save(function (err) {
            // err.msg = "under-age";
        });
    });
```