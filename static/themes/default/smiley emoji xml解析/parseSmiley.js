
var fs = require('fs');

PARSE_COMMENT_RE = /<!--[\s\S]*?-->/;
PARSE_GROUP_RE = /\s*<group\s*id="([^"]+)"\s*>([\s\S]*?)<\/group>/;
PARSE_NORNAL_FILENAME_BY_NAME_RE = /^\s*<smiley\s+name="([^"]+)"\s*filename="([^"]+)"\s*thumbnail="([^"]+)"\s*tip="([^"|]+)"[^/]*\/>\s*$/m;

PARSE_NAME_BY_ID_RE = /^\s*<smiley\s+id="(\d+)"\s+name="([^"]+)"[^/]*\/>\s*$/m;

PARSE_CHINESE_TIP_BY_TIP_RE = /id="([^"]+)"\s*>\s*([^<]+)\s*</m;

var s1 = fs.readFileSync('./smiley.xml', 'utf8');
var s2 = fs.readFileSync('./smiley 2.xml', 'utf8');
var s3 = fs.readFileSync('./string_CHN.xml', 'utf8');

var match_group, match, smiley, group, comment;

// remove comments
while(comment = s1.match(PARSE_COMMENT_RE)) {
    s1 = s1.replace(PARSE_COMMENT_RE, "");
}

var smileys = [];
while(match = s1.match(PARSE_NORNAL_FILENAME_BY_NAME_RE)) {
    smileys.push({ name: match[1], filename: match[2], thumbnail: match[3], tip: match[4], title: match[4] });

    s1 = s1.replace(PARSE_NORNAL_FILENAME_BY_NAME_RE, "");
}

// get smileys id
while(match = s2.match(PARSE_NAME_BY_ID_RE)) {
    var smiley = getSmileyByName(match[2]);
    if (smiley) {
        smiley.id = match[1];
    }
    s2 = s2.replace(PARSE_NAME_BY_ID_RE, "");
}


var TitleEnum = {};
// map chinese tip
while(match = s3.match(PARSE_CHINESE_TIP_BY_TIP_RE)) {
    TitleEnum[match[1]] = match[2];

    s3 = s3.replace(PARSE_CHINESE_TIP_BY_TIP_RE, "");
}

smileys.forEach(function(smiley) {
    if (smiley.tip in TitleEnum) {
        smiley.title = TitleEnum[smiley.tip];
    }
});

// filter
smileys.forEach(function(smiley, index) {
    smileys[index] = { filename: smiley.filename, title: smiley.title, id: smiley.id, type: smiley.type };
});

console.log(smileys.length);

fs.writeFileSync('smiley.json', JSON.stringify(smileys));

// --helper
function getSmileyByName(name) {
    var res;
    smileys.forEach(function(smiley) {
        if (!res && smiley.name === name) {
            res = smiley;
        }
    });
    return res;
}

function getSmileysByTip(tip) {
    var res = [];
    smileys.forEach(function(smiley) {
        if (smiley.tip === tip) {
            res.push(smiley);
        }
    });
    return res;
}



// 解析EMOJI
var resource = fs.readFileSync('./emoji.txt', 'utf8');
var EMOJI_RE = /.*\((.+?)\)\s*(.+)/;
var emojis = [];

while (match = resource.match(EMOJI_RE)) {
    emojis.push({ unified: match[1], title: match[2] });
    resource = resource.replace(EMOJI_RE, "");
}

console.log(emojis.length);
fs.writeFileSync('emoji.json', JSON.stringify(emojis));


