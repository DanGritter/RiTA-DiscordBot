const { ApplicationCommandOptionType } = require("discord-api-types/v10");
const { ChannelType } = require("discord.js");

const languages = [ {name: "English",
   value: "English"},
{name: "German",
   value: "German"},
{name: "Russian",
   value: "Russian"},
{name: "Spanish",
   value: "Spanish"},
{name: "French",
   value: "French"},
{name: "Japanese",
   value: "Japanese"} ];

const commands = [
   // 0
   {
      name: "this",
      description: "translate text via command",
      options: [
         {
            choices: languages,
            "type": ApplicationCommandOptionType.String,
            name: "to",
            description: "language to convert text to",
            required: true
         },
         {
            "type": ApplicationCommandOptionType.String,
            name: "text",
            description: "text to translate",
            required: true
         },
         {
            choices: languages,
            "type": ApplicationCommandOptionType.String,
            name: "from",
            description: "language text is in"
         }
      ]
   },
   // 1
   {
      name: "last",
      description: "translate last messages",
      options: [
         {
            choices: languages,
            "type": ApplicationCommandOptionType.String,
            name: "to",
            description: "language to convert text to",
            required: true
         },
         {
            choices: languages,
            "type": ApplicationCommandOptionType.String,
            name: "from",
            description: "language text is in"
         },
         {
            "type": ApplicationCommandOptionType.Integer,
            name: "num",
            description: "number of messages to convert",
            min_value: 1,
            max_value: 10
         }
      ]
   },
   // 2
   {
      name: "channel",
      description: "Create channel translation ",
      options: [
         {
            choices: languages,
            "type": ApplicationCommandOptionType.String,
            name: "to",
            description: "language to convert text to",
            required: true
         },
         {
            choices: languages,
            "type": ApplicationCommandOptionType.String,
            name: "from",
            description: "language text is in"
         },
         //         {
         //            "type": ApplicationCommandOptionType.Channel,
         //            name: "for",
         //            description: "channel to translate messages from",
         //            channel_types: [ChannelType.GuildText]
         //         },
         {
            "type": ApplicationCommandOptionType.Channel,
            name: "for",
            description: "channel to translate messages to",
            channel_types: [ChannelType.GuildText]
         }
      ]
   },
   // 3
   {
      name: "group",
      description: "Create translation group",
      options: [
         {
            //    "name": "action",
            //    "type": ApplicationCommandOptionType.SubcommandGroup,
            //    description: "What type of group action",
            //    options: [{
            name: "add",
            description: "add group or group item",
            "type": ApplicationCommandOptionType.Subcommand,
            options: [
               {
                  "type": ApplicationCommandOptionType.String,
                  name: "name",
                  description: "group name",
                  required: true
               },
               {
                  choices: languages,
                  "type": ApplicationCommandOptionType.String,
                  name: "lang",
                  description: "language this channel uses",
                  required: true
               },
               {
                  "type": ApplicationCommandOptionType.Channel,
                  name: "channel",
                  description: "channel to add to group, will be created if it doesn't exist based on translation from group name",
                  channel_types: [ChannelType.GuildText]
               },
               {
                  "type": ApplicationCommandOptionType.String,
                  name: "channelname",
                  description: "Channel Name to use to create the channel if channel doesn't already exist"
               }
            ]
         },
         {
            name: "remove",
            description: "remove group or group item",
            "type": ApplicationCommandOptionType.Subcommand,
            options: [
               {
                  "type": ApplicationCommandOptionType.String,
                  name: "name",
                  description: "group name"
               },
               {
                  "type": ApplicationCommandOptionType.Channel,
                  name: "channel",
                  description: "channel to remove to group",
                  channel_types: [ChannelType.GuildText]
               },
               {
                  choices: languages,
                  "type": ApplicationCommandOptionType.String,
                  name: "lang",
                  description: "language to remove from group"
               }
            ]
         },
         {
            name: "list",
            description: "list groups",
            "type": ApplicationCommandOptionType.Subcommand,
            options: [
               {
                  "type": ApplicationCommandOptionType.String,
                  name: "name",
                  description: "group name"
               }
            ]
         },
         {
            name: "setup",
            description: "setup group tasks",
            "type": ApplicationCommandOptionType.Subcommand,
            options: [
               {
                  "type": ApplicationCommandOptionType.String,
                  name: "name",
                  description: "group name",
                  required: true
               }
            ]
         }
      ]
      // }]
   },
   // 4
   {
      name: "stop",
      description: "stop translation operations",
      options: [{
         name: "task",
         description: "stop task",
         "type": ApplicationCommandOptionType.Subcommand
      },
      {
         name: "user",
         description: "stop user translation",
         "type": ApplicationCommandOptionType.Subcommand
      },
      {
         name: "channel",
         description: "stop channel translation",
         "type": ApplicationCommandOptionType.Subcommand,
         options: [
            {
               "type": ApplicationCommandOptionType.Channel,
               name: "channel",
               description: "channel to remove to group",
               channel_types: [ChannelType.GuildText]
            }
         ]
      },
      {
         name: "all",
         description: "stop guild translation",
         "type": ApplicationCommandOptionType.Subcommand,
         options: [
            {
               "type": ApplicationCommandOptionType.String,
               name: "server",
               description: "server ID to remove tasks from",
               channel_types: [ChannelType.GuildText]
            }
         ]
      }
      ]
   },
   // 5
   {
      name: "tasks",
      description: "interact with tasks",
      options: [
         {
            name: "user",
            description: "display user translations",
            "type": ApplicationCommandOptionType.Subcommand
         },
         {
            name: "channel",
            description: "display channel translations",
            "type": ApplicationCommandOptionType.Subcommand,
            options: [
               {
                  "type": ApplicationCommandOptionType.Channel,
                  name: "channel",
                  description: "channel to remove to group",
                  channel_types: [ChannelType.GuildText]
               },
               {
                  "type": ApplicationCommandOptionType.Boolean,
                  name: "current",
                  description: "show tasks for current channel"
               }
            ]
         },
         {
            name: "all",
            description: "display guild translations",
            "type": ApplicationCommandOptionType.Subcommand
         }
      ]
   },
   //        {
   //    "name": "permissions",
   //    "description": "Get or edit permissions for a user or a role",
   //    "options": [
   //        {
   //            "name": "user",
   //            "description": "Get or edit permissions for a user",
   //            "type": 2, // 2 is type SUB_COMMAND_GROUP
   //            "options": [
   //                {
   //                    "name": "get",
   //                    "description": "Get permissions for a user",
   //                    "type": 1 // 1 is type SUB_COMMAND
   //                },
   //                {
   //                    "name": "edit",
   //                    "description": "Edit permissions for a user",
   //                    "type": 1
   //                }
   //            ]
   //        },
   //        {
   //            "name": "role",
   //            "description": "Get or edit permissions for a role",
   //            "type": 2,
   //            "options": [
   //                {
   //                    "name": "get",
   //                    "description": "Get permissions for a role",
   //                    "type": 1
   //                },
   //                {
   //                    "name": "edit",
   //                    "description": "Edit permissions for a role",
   //                    "type": 1
   //                }
   //            ]
   //        }
   //    ]
   //},
   {
      name: "info",
      description: "information about translations"
   },
   {
      name: "list",
      description: "list translations"
   },
   {
      name: "stats",
      description: "translation statistics"
   },
   {
      name: "version",
      description: "bot version"
   },
   {
      name: "invite",
      description: "get invitation link"
   },
   {
      name: "shards",
      description: "get shard information"
   },
   {
      name: "proc",
      description: "get process information"
   },
   {
      name: "cpu",
      description: "get cpu information"
   },
   {
      name: "settings",
      description: "adjust translation settings"
   },
   {
      name: "clear",
      description: "Clear messages"
   }
];

module.exports = commands;

