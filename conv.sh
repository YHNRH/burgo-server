#!/bin/bash
RAW="output.raw"
WAV="output.wav"
WAV16="output16.wav"

if [ -s $RAW ];then
	ffmpeg -f u8 -ar 10000 -ac 1 -i $RAW -y $WAV
	ffmpeg -i $WAV -ar 16000 -y $WAV16
	echo -n > $RAW
	#mpv $WAV

else
	echo "empty raw"
fi
