### hasMany

Is a **many to many** relationship (includes join table).<br/>
Eg: `Patient.hasMany('doctors', Doctor, { why: String }, { reverse: 'patients', key: true })`.<br/>
Patient can have many different doctors. Each doctor can have many different patients.

This will create a join table `patient_doctors` when you call `Patient.sync()`:

 column name | type
 :-----------|:--------
 patient_id  | Integer
 doctor_id   | Integer
 why         | varchar(255)

The following functions will be available:

```javascript
// Get the list of associated doctors
patient.getDoctors(function(err, doctors) {
  // ...
});

// Add entries to the join table
patient.addDoctors([phil, bob], function(err) {
  // ...
});

// Remove existing entries in join table and add new ones
patient.setDoctors([phil, nephewOfBob], function(err) {
  // ...
});

// Checks if patient is associated to specified doctors
patient.hasDoctors([bob], function(err, patientHasBobAsADoctor) {
  // because that is a totally legit and descriptive variable name
  if (patientHasBobAsADoctor) {
    // ...
  } else {
    // ...
  }
});

// Remove specific entries from the join table
patient.removeDoctors([bob], function(err) {
  // ...
});

// And all of the doctor's have their own methods for selecting patients!
bob.getPatients(function(err, patients) {
  if (patients.indexOf(you) !== -1) {
    // woot!
  } else {
    // ...
  }
});

// and so on and so forth
```

To associate a doctor to a patient:

```javascript
patient.addDoctor(surgeon, {why: 'remove appendix'}, function(err) {
  // ...
});

// or...
surgeon.addPatient(patient, {why: 'remove appendix'}, function(err) {
  // ...
});
```

which will add `{patient_id: 4, doctor_id: 6, why: "remove appendix"}` to the join table.

### API

```js
Model.hasMany(
  name,       // String. Association name
  otherModel, // Model. The model we're association to
  extraProps, // Object. Extra properties that will appear on the join table
  opts        // Object. Options for the association
);
```
#### opts
| option name    | type      | description
|:---------------|:----------|:--------------
| autoFetch      | Boolean   | Default: false. If true, association will be automatically fetched with parent.
| autoFetchLimit | Number    | Default: 1. How many levels deep to auto fetch
| key            | Boolean   | Default: false (for historical reasons). If true, foreign key columns in the table will form a composite key.
| mergeTable     | String    | Custom name for the merge table
| mergeId        | String    | Custom name for column referencing this model
| mergeAssocId   | String    | Custom name for column referencing other model
| reverse        | String    | Default: false. If true, association will be accessible from the other model with the specified name.
| getAccessor    | String    | Default: 'get' + Name. Allows overwriting associating accessor.
| setAccessor    | String    | Default: 'set' + Name. Allows overwriting associating accessor.
| hasAccessor    | String    | Default: 'has' + Name. Allows overwriting associating accessor.
| delAccessor    | String    | Default: 'del' + Name. Allows overwriting associating accessor.
| addAccessor    | String    | Default: 'add' + Name. Allows overwriting associating accessor.
