#!/usr/bin/env bash
function usage(){
    echo 'usage: ./release.sh <major|minor|patch>'
    exit -1
}

release_type="${1}"

case "${release_type}" in
    major|minor|patch)
        echo "Performing ${release_type} release ..."
    ;;
    *)  echo "invalid release_type: ${release_type}"
        usage
    ;;
esac

set -e
USER=$(sed -nr 's/login\s+(\w+)/\1/p'  ${HOME}/.netrc)
PASS=$(sed -nr 's/password\s+(\w+)/\1/p'  ${HOME}/.netrc)
DOCKER_GITHUB_USER=${USER} DOCKER_GITHUB_CODE=${PASS} release ${release_type}