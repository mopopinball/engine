# Mopo Pinball - (Mo)dern (Po)wer Pinball

[![semantic-release: node](https://img.shields.io/badge/semantic--release-node-e10079?logo=semantic-release)](https://github.com/semantic-release/semantic-release)

A modern pinball engine built for modern hardware to revive old Gottlieb pinball machines. Revived machines have new rules and other modern capabilies not possible on 1980s hardware. CPUs are powered by a Raspberry Pi and the engine is build for Node in Typescript.

## Special Thanks to [LISY](https://lisy.dev)

This project is made possible by the [LISY](https://lisy.dev) project! LISY provides the hardware and other resources which make Mopo Pinball possible.

## Getting Started

1. Build your CPU
    * Visit https://lisy.dev to buy unpopulated CPU boards and read other hardware documentation.
    * Build your CPU, or have a PCB manufacturer do it for you!
2. Burn a Raspberry Pi SD card image
    * Go to https://www.raspberrypi.com/software/ and download the Raspberry Pi Imager
    * Burn the `Raspberry Pi OS Lite (32-bit)` option to an SD card.
3. Boot the Raspberry Pi
    * Strongly recommend the `Raspberry Pi Zero 2 W`
4. On new images, set the following config on boot:
    * Keyboard Layout (Typically choose `English (US)`)
    * New username: `pi` (REQUIRED)
    * Password: (Typically `raspberry`, but can be anything)
5. Change some `raspi-config` settings
    * run `sudo raspi-config`
    * Set the WLAN (country, name/password)
    * Enable I2C
    * Enable SSH (Recommended. Makes step 6 easier.)
6. On the Pi run the following command (capitalization matters):

```shell
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo reboot now
wget https://raw.githubusercontent.com/mopopinball/engine/master/setup/mosquitto.conf -O mosquitto.conf
sudo docker run -d --restart always -p 1883:1883 -p 9001:9001 -v ./mosquitto.conf:/mosquitto/config/mosquitto.conf eclipse-mosquitto
sudo docker pull ghcr.io/mopopinball/engine:master
sudo docker run -d --privileged --network=host --restart always ghcr.io/mopopinball/engine:master
```

```
# OLD
sudo sh -c "curl https://raw.githubusercontent.com/mopopinball/engine/master/setup/setup.sh | bash"
```

7. Select the game to use
8. Run the following commands
    * `/home/pi/mopo/engine/select-game.sh`
    * `sudo /home/pi/mopo/engine/flash.sh` (once for each PIC)

## Hardware Support

* LISY
    * 5.1
    * 6 (FUTURE)
* Gottlieb
    * System 80
    * System 80A (FUTURE)
    * System 80B (FUTURE)

## Developing

[Commit Guidelines](https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#-git-commit-guidelines)

Mopo Pinball has a visual designer which is used to design games. Games have new rules, advanced display output and
other features.