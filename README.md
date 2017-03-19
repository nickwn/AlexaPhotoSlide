# AlexaPhotoSlide
An unfinished Amazon Alexa skill

### What is it?
I created this for the
[Internet of Voice](https://www.hackster.io/contests/alexa-raspberry-pi)
competition on [hackster.io](https://hackster.io). The goal was to have a voice
controlled slideshow that would navigate through photos and albums at the
user's command. The slideshow would be displayed by a Raspberry Pi running
[OSMC](https://osmc.tv/).

The code in this repository is for the Alexa skill, which runs in an AWS Lambda
function. It recieves a request from the Alexa device, notifies the Raspberry Pi
connected to the home's AWS IoT system, and tells the Alexa
device what to say in reply.

### Dependencies
 * aws-iot-device-sdk
