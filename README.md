Pentadactyl Example Plugin: Foo
==================================

# Overview

Example Pentadactyl plugin. Just figuring out how things work. The main goal is to learn the Pentadactyl API, gradually adding features to this example, emphasizing documentation and rationale along the way.

# The "Foo" plugin

A simple plugin that displays pre-defined and user-defined messages in a variety (two!) of ways. The default behavior simply shows a pop-up dialog that contains a default message. The user can also configure the plugin to use either the pentadactly status line, or both. Users can add new strings, showing the ability of the plugin to support configuration settings in the pentadactyl profile, and override the default message with arguments to the "show" command. User can show arbitrary (unnamed) messages, and override the display types with arguments.

Yes, it's a ridiculous plugin. But, at least the features don't get in the way of understanding the API.

## Usage

Here's some examples of how to use the commands and settings of the plugin. These are documented in full in the script itself, as manual regression tests. Advice on automating these gladly accepted.

1. Default command behavior

        :foo-show

    **Result**: Pop-up dialog: "The default message"

1. Change default message

        :set foo-default-message=greeting
        :foo

    **Result**: Pop-up dialog: "Hello there!"

1. Change default display from pop-up to status line

        : set foo-display=s
        : foo -name=farewell

    **Result**: Status line message: "See you later"

1. Display an arbitrary message, and override the default display mode

        :foo -message="Sneak attack" -dialog-only

    **Result**: Pop-up dialog: "Sneak attack"

1. Add a new named message and set it to the default

        :foo fds=ds
        :foo-add-message -name congrats -message="Congratulations! That was great."
        :set fdm=congrats
        :foo

    **Result**: Pop-up dialog and status line display: "Congratulations! That was great."

## Pentadactyl features covered

* Creating a command
* Creating an option
* Abbreviations of commands and options
* Overriding an option with an argument
* Tab completion of arguments
* Argument types
    * String
    * Character options
    * Boolean (flag)
* Using the browser DOM

