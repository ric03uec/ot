# ec2stats
calculating and plotting different ec2 stats. Tested strictly with Docker

## CLI

```
$ docker run -v $pwd/stats:/stats -e AWS_SECRET_KEY -e AWS_ACCESS_KEY ric03uec/ec2stats:master

$ docker run -v $pwd/stats:/stats ric03uec/ec2stats:master \
    --interval=5            // interval to calculate average in min, 5 by default
    --period=12             // period over which to calculate stats in hr, 12 by default
    --append=false          // whether to create a new stats file or append
    --outfile=stats.csv     // name of the output file stored in stats folder
    --query={}              // json parsable query, see docs for constructing queries
```

## Network Stats
- dockerfile to run a cron job
- accept aws access and secret key
- query definition
```
{
    "type": 'nwIn/nwOut/nwAll',
    "includes": [
        {
            "key": 'tag',
            "values": [
                { "mylable1": 'myvalue1' },
                { "mylabel2": 'myvalue2' }
            ]
        },
        {
            "key": 'id',
            "values": '["i-foo", "i-bar"]'
        }
    ],
    "excludes": [
        {
            "key": 'tag',
            "values": [
                { "mylable3": 'myvalue3' },
            ]
        }
    ]
}
```

## TODO
- [x] add ESlint
- [x] use underscore
- [  ] add/use logger
- [  ] add scheduler stub
    - configurable refresh interval, 30 secs default
    - read all rules
- [  ] add rule parser stub
    - constructor signature
    - dummy results
- [  ] add output stub
    - dump output from results into csv
- [  ] add dockerfile
