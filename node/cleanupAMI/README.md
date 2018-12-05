## Cleanup AMIs

### Objective
- For the given account ID and access keys, remove/deregister all AMI's from EC2 that the
  account ID owns.
    - DO NOT remove/deregister the AMI's that are whitelisted
    - Remove all associated volume snapshots

### Execute

```
$ docker build -t ric03uec/ot:remove_ami .
$ docker run -e AWS_ACCESS_KEY=foo -e AWS_SECRET_KEY=bar -e AWS_ACCOUNT_ID=moo ric03uec/ot:remove_ami
```
