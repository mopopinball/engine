# Mopo Pinball - (Mo)dern (Po)wer Pinball

A modern pinball engine built for modern hardware to revive old Gottlieb pinball machines. Revived machines have new rules and other modern capabilies not possible on 1980s hardware. CPUs are powered by a Raspberry Pi and the engine is build for Node in Typescript.

## Special Thanks to [LISY](https://lisy.dev)

This project is made possible by the [LISY](https://lisy.dev) project! LISY provides the hardware and other resources which make Mopo Pinball possible.

## Getting Started

1. Build you CPU
    * Visit https://lisy.dev to buy unpopulated CPU boards and read other hardware documentation.
    * Build your CPU, or have a PCB manufacturer do it for you!
2. Burn a Raspberry Pi SD card image
    * Go to https://www.raspberrypi.com/software/ and download the Raspberry Pi Imager
    * Burn the `Raspberry Pi OS Lite (32-bit)` option to an SD card.
3. Boot the Raspberry Pi
4. On new images, set the following config on boot:
    * Keyboard Layout (Typically choose `English (US)`)
    * New username: `pi` (REQUIRED)
    * Password: (Typically `raspberry`, but can be anything)
5. Change some `raspi-config` settings
    * run `sudo raspi-config`
    * Set the WLAN country
    * Enable I2C
    * (Optional) Enable SSH (Option 3/P2)
    * Expand the filesystem
6. On the Pi run the following command (capitalization matters):

```
sudo sh -c "curl https://raw.githubusercontent.com/mopopinball/engine/beta/setup/setup.sh | bash"
```

7. Reboot
8. Run post-setup tasks
    * Select game by running `/home/pi/mopo/engine/select-game.sh`
    * Flash PICs by running `/home/pi/mopo/engine/flash.sh`

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