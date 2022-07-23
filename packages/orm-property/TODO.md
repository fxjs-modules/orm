## Test

- [ ] Real DB Test: run `toStorageType` on all properties first, make database schema, then read column-info from database, run `rawToProperty` on all column-info items, check if the result is same as expected.
    - [ ] mysql
    - [ ] postgresql
    - [ ] sqlite
- [ ] Add More Tests about `rawToProperty` until enough.
    - [ ] mysql
    - [ ] postgresql
    - [ ] sqlite


## Dev

- [ ] Support Make Custom Transformer by function `defineTransformer`