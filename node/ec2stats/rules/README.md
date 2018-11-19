# Rules
- all the `*.js` files in this folder will be loaded by the scheduler
- for each file, the scheduler will
    - call the constructor and initialize the rule
    - create an entry in the map for the number of times the rule will be
      executed and at what intervals
    - initialize the output data structures
