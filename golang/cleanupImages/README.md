## Cleanup Images

### Objective
- For the given project ID, remove all machine images from GCP that account owns.
    - DO NOT remove images that are whitelisted
    - Remove all associated volume snapshots

### Execute

```
$ docker build -t ric03uec/ot:remove_images .
$ docker run -e GOOGLE_APPLICATION_CREDENTIALS=/path/to/creds PROJECT_ID=project_id ric03uec/ot:remove_images
```
