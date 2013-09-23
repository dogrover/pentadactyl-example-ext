// Example pentadactyl plugin. Just figuring out how things work.

// A simple plugin that displays pre-defined and user-defined messages in
// a variety (two!) of ways. The default behavior simply shows a pop-up dialog
// that contains a default message. The user can also configure the plugin to
// use either the pentadactly status line, or both. Users can add new strings,
// showing the ability of the plugin to support configuration settings in the
// pentadactyl profile, and override the default message with arguments to the
// "show" command. User can show arbitrary (unnamed) messages, and override the
// display types with arguments.

// Some manual tests (until I figure out how to write unit tests).
//
// ---------------------------------------------------------------------------
// Tests:
//   - command name appears in tab-completion, with help text
//   - default command behavior
//
// :foo-show
//      Pop-up dialog: "The default message"
//
// ---------------------------------------------------------------------------
// Tests:
//   - option name appears in tab completion, with help text
//   - message names appear in option argument tab completion
//   - update the default message option
//   - new default behavior
//   - command abbreviation
//
// :set foo-default-message=greeting
//      No output, but after typing "=", tab completion should show these message names:
//          standard, greeting, farewell
// :foo
//      Pop-up dialog: "Hello there!"
//
// ---------------------------------------------------------------------------
// Tests:
//   - display type character flags appear in tab completion, with help text
//   - update the display types option
//   - disable dialog display type
//   - enable statusline display type
//   - statusline display
//   - message names appear in command argument tab completion
//   - override default message with command argument
//
// :set foo-displays=s
//      No output, but tab-completion should show options "d" and "s", with
//      their associated help strings.
// :foo -name=farewell
//      Tab completion should show all message names after "="
//      Status-line message: "See you later"
//
// ---------------------------------------------------------------------------
// Tests:
//   - test argument values with quotes and embedded spaces
//   - display arbitrary message text
//   - ignore the display types option
//   - force display in a dialog box only
//
// :foo -message="Sneak attack" -dialog-only
//
// ---------------------------------------------------------------------------
// Tests:
//   - display type option abbreviation
//   - message names appear in "add" command argument tab completion
//   - add a new named message
//   - default message option abbreviation
//   - update option argument tab completion with new message name
//   - set default message to user-defined, named message
//
// :set fds=ds
//      No output. Tab completions should present an empty option list after using
//      both available types
// :foo-add-message -name congrats -message="Congratulations! That was great."
//      No output. Tab completion for name arg should show all 3 known names.
//      Message should have no tab completion entries.
// :set fdm=congrats
//      No output. Tab completion should now include "congrats" in the list of
//      available message names (4 entries now).
// :foo
//      In no particular order, the user should see both a pop-up dialog and
//      a statusline message, both showing "Congratulations! That was great."

// See http://ejohn.org/blog/ecmascript-5-strict-mode-json-and-more/
"use strict";

// It's not necessary to create a separate object for containing plugin info,
// but it helps avoid globals (err. . ., beyond this one, I mean).
let foo = {
    // The list of pre-defined messages the plug-in provides
    Messages: {
        names: {
            'standard' : 'The default message',
            'greeting' : 'Hello there!',
            'farewell' : 'See you later',
        },

        // Context-sensitive tab-completion function
        name_completer: function (context, args) {
            context.completions = foo.Messages.names;
        },
    },

    // Display type descriptions. Nothing specific to Pentadactyl. More easily
    // allows functions to re-use help strings, option flags, and such.
    Displays: {
        names: {
            'dialog': {
                enabled    : true,
                display    : function (msg) { window.alert(msg); },
                description: 'Displays the message in a popup dialog box',
                option_flag: 'd',
            },
            'statusline': {
                enabled    : false,
                display    : function (msg) { dactyl.echo(msg, null); },
                description: 'Displays the message in the pentadactyl statusline',
                option_flag: 's',
            },
        },

        // By default, we'll enable only the "dialog" display type. This is not
        // where penta looks for this info. See the foo-displays option for
        // that.
        default_flags: 'd',

        // Iterates through the display types, and builds a map of option_flag
        // characters to display type descriptions. For use by the charlist
        // option tab completer.
        option_map: function () {
            let flags = {};
            for (let disp in mapItems(foo.Displays.names)) {
                flags[disp.option_flag] = disp.description;
            }
            return flags;
        },

        // Tab completion function for display type names
        name_completer: function (context, args) {
            context.completions = foo.Displays.names;
        },
    },
};

// Example options
// See dactyl\common\modules\options.jsm: Options
// NOTE: You get the *value* of an option with options['<opt_name>']. You
//       get the option *object* with options.get('<opt_name>').

// Sets the name of the message that the foo command uses by default.
group.options.add(
    // Names, full and abbreviated
    ['foo-default-message', 'fdm'],

    // Description: displayed in the help
    'Set the name of the default message',

    // Type: see Option.types
    'string',

    // Default value: set at penta startup, but can be overridden in profile
    'standard',

    // "extraInfo" structure
    {
        // See dactyl\common\modules\completion.jsm: CompletionContext
        // Also: useragent-dev.js, the user agent plugin
        completer: foo.Messages.name_completer,
    }
);

group.options.add(
    ['foo-displays', 'fds'],
    'Choose the set of displays to use',
    'charlist',
    foo.Displays.default_flags,
    {
        values: foo.Displays.option_map(),

        // Iterates the display types, enabling all those whose option_flag
        // value is found in the set of characters passed to this option.
        // Disables all others.
        setter: function(value) {
            for (let disp in mapItems(foo.Displays.names)) {
                disp.enabled = (value.indexOf(disp.option_flag) >= 0);
            }
            return value;
        }
    }
);

// Example command
// See dactyl\common\modules\commands.jsm#Command and #CommandOption
group.commands.add(
    // Specs
    ['foo[-show]', 'foo'],

    // Description
    'Example command "foo": show a customizable alert message',

    // Action. What the command does. Always gets 'args'.
    // NOTE: Args are indexable by name (args['-<option_name>'] or by index
    //       (args[0])
    // With no arguments, the foo command displays the contents of the message
    // named by the 'foo-default-message' option, using the default set of display
    // types. User can override message name, message text, and display methods
    // used.
    function (args) {
        let name = args['-name'] || options['foo-default-message'];
        let text = args['-message'] || foo.Messages.names[name];

        // Check for the override option first
        if (args['-dialog-only']) {
            foo.Displays.names['dialog'].display(text);
        } else {
            // Display the message using all enabled types
            for (let disp in mapItems(foo.Displays.names)) {
                if (disp.enabled) { disp.display(text); }
            }
        }
    },

    // Extra options to the command
    {
        // See dactyl\common\modules\commands.jsm#Commands@parseArguments
        // Takes 0, 1, or 2 args, so must handle any number
        argCount: '*',

        // List of options supported by this command
        options: [
            {
                names: ['-name', '-n'],
                description: 'The named message to show',
                type: CommandOption.STRING,
                completer: foo.Messages.name_completer,
            }, {
                names: ['-message', '-m'],
                description: 'The message text to show',
                type: CommandOption.STRING,
            }, {
                // How to use a "flag"-type option. Takes no values.
                names: ['-dialog-only', '-d'],
                description: 'Use the dialog type only, ignoring other display options',
                // type: CommandOption.NOARG    // Default arg type
            },
        ],
    }
);

// Users aren't usually going to want to edit code to change your plugin.
// Here's a command that lets the user add a named message in their profile.
// Also overwrites existing entries.
group.commands.add(
    ['foo-add-message', 'fnew'],
    'Add a new named message to the pre-defined list',
    function (args) {
        // The allowUnknownOptions=false argument handles extra and unknown
        // arguments, but we still need to enforce that we have the ones we
        // need.
        if (!args['-name']) {
            dactyl.echoerr('Missing required "-name" argument', null);
            return;
        } else if (!args['-message']) {
            dactyl.echoerr('Missing required "-message" argument', null);
            return;
        }

        // Store the message in the list
        foo.Messages.names[args['-name']] = args['-message'];
    }, {
        allowUnknownOptions: false,
        argCount: '*',
        options: [
            {
                names: ['-name', '-n'],
                description: 'The short name for the message',
                type: CommandOption.STRING,
                completer: foo.Messages.name_completer,
            }, {
                names: ['-message', '-m'],
                description: 'The message text to show',
                type: CommandOption.STRING,
            },
        ],
    }
);

// Helper function. Seems to be common to want to iterate the values in a map.
// This function simplifies that a bit.
function mapItems (map) {
    for (let key in map) if (map.hasOwnProperty(key)) {
        yield map[key];
    }
}
