#!/bin/bash

# Exit on error
set +x

# Source for map imagery
SRC_URL="http://www.hpcf.upr.edu/~abel/phl/VPE_ImageSet_LR.zip"

# Directories we're working in
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
WORK_DIR="${DIR}/mapworkspace"

if [ ! -d "${WORK_DIR}" ]; then
	echo "Making directory ${WORK_DIR}"
	mkdir -p "${WORK_DIR}"
fi

SRC_ZIP="${WORK_DIR}/maps.zip"
if [ ! -f "${SRC_ZIP}" ]; then
	echo "Downloading maps from ${SRC_URL} to ${SRC_ZIP}"
	curl -L "${SRC_URL}" >"${SRC_ZIP}"
fi

POSTERS_DIR="${WORK_DIR}/posters"
unzip -nq "${SRC_ZIP}" '*_Poster_[0-9][0-9][0-9].jpg' -d "${POSTERS_DIR}"

DEST_DIR="${WORK_DIR}/mapimages"
if [ ! -d "${DEST_DIR}" ]; then
	echo "Making directory ${DEST_DIR}"
	mkdir -p "${DEST_DIR}"
fi

POSTERS=$(find "${POSTERS_DIR}" -name '*.jpg')
for poster in ${POSTERS}; do
	dest="${DEST_DIR}/$(basename "${poster}")"
	if [ ! -f "${dest}" ]; then
		convert "${poster}" -crop 730x364+25+196 "${dest}"
	else
		echo "Skipping ${dest} since it already exists"
	fi
done

