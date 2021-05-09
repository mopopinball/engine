# Mopo Pinball - (Mo)dern (Po)wer Pinball

A modern pinball engine built for modern hardware to revive old Gottlieb pinball machines. Revived machines have new rules and other modern capabilies not possible on 1980s hardware. CPUs are powered by a Raspberry Pi and the engine is build for Node in Typescript.

## Special Thanks

This project is made possible by the [LISY](https://lisy.dev) project! LISY provides the hardware and other resources which make Mopo Pinball possible.

## Getting Started

1. Visit https://lisy.dev to buy unpopulated CPU boards and read other hardware documentation.
2. Build your CPU!
3. Burn a Raspberry Pi SD card image
4. Boot the Raspberry Pi
5. On the Pi run the following command

```
curl https://raw.githubusercontent.com/mopopinball/engine/beta/setup/update.sh | bash
```

6. Select your game.


## Developing

[Commit Guidelines](https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#-git-commit-guidelines)

Mopo Pinball has a visual designer which is used to design games. Games have new rules, advanced display output and
other features.