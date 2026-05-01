import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { motion } from 'motion/react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useLanguage } from '../contexts/LanguageContext';

const SERVER_ID = 'make-server-a1c86d03';

interface StickerPickerProps {
  open: boolean;
  onClose: () => void;
  onSelectSticker: (sticker: string) => void;
}

interface Sticker {
  id: string;
  imageUrl: string;
  sourceUrl?: string;
  cropData?: {
    x: number;
    y: number;
    size: number;
  };
}

interface StickerPack {
  name: string;
  stickers: Sticker[];
}

// Emoji with searchable keywords
interface EmojiData {
  emoji: string;
  keywords: string[];
}

const STICKER_CATEGORIES: Record<string, EmojiData[]> = {
  'Emotions': [
    { emoji: '😀', keywords: ['smile', 'happy', 'grin'] },
    { emoji: '😃', keywords: ['smile', 'happy', 'joy'] },
    { emoji: '😄', keywords: ['smile', 'happy', 'laugh'] },
    { emoji: '😁', keywords: ['grin', 'smile', 'happy'] },
    { emoji: '😆', keywords: ['laugh', 'happy', 'smile'] },
    { emoji: '😅', keywords: ['sweat', 'smile', 'relief'] },
    { emoji: '🤣', keywords: ['laugh', 'rofl', 'lol', 'rolling'] },
    { emoji: '😂', keywords: ['cry', 'laugh', 'tears', 'joy'] },
    { emoji: '🙂', keywords: ['smile', 'slight'] },
    { emoji: '🙃', keywords: ['upside', 'down', 'silly'] },
    { emoji: '😉', keywords: ['wink', 'flirt'] },
    { emoji: '😊', keywords: ['blush', 'smile', 'happy'] },
    { emoji: '😇', keywords: ['angel', 'halo', 'innocent'] },
    { emoji: '🥰', keywords: ['love', 'hearts', 'adore'] },
    { emoji: '😍', keywords: ['love', 'heart', 'eyes', 'crush'] },
    { emoji: '🤩', keywords: ['star', 'eyes', 'excited', 'wow'] },
    { emoji: '😘', keywords: ['kiss', 'blow', 'love'] },
    { emoji: '😗', keywords: ['kiss', 'whistle'] },
    { emoji: '😚', keywords: ['kiss', 'closed', 'eyes'] },
    { emoji: '😙', keywords: ['kiss', 'smile'] },
    { emoji: '😋', keywords: ['yum', 'tongue', 'delicious'] },
    { emoji: '😛', keywords: ['tongue', 'out'] },
    { emoji: '😜', keywords: ['wink', 'tongue', 'crazy'] },
    { emoji: '🤪', keywords: ['crazy', 'wild', 'goofy'] },
    { emoji: '😝', keywords: ['tongue', 'eyes', 'closed'] },
    { emoji: '🤑', keywords: ['money', 'dollar', 'rich'] },
    { emoji: '🤗', keywords: ['hug', 'embrace'] },
    { emoji: '🤭', keywords: ['oops', 'hand', 'mouth'] },
    { emoji: '🤫', keywords: ['shush', 'quiet', 'secret'] },
    { emoji: '🤔', keywords: ['think', 'hmm', 'wondering'] },
    { emoji: '🤐', keywords: ['zipper', 'mouth', 'quiet'] },
    { emoji: '🤨', keywords: ['eyebrow', 'skeptical', 'suspicious'] },
    { emoji: '😐', keywords: ['neutral', 'blank'] },
    { emoji: '😑', keywords: ['expressionless', 'meh'] },
    { emoji: '😶', keywords: ['no', 'mouth', 'silent'] },
    { emoji: '😏', keywords: ['smirk', 'sly'] },
    { emoji: '😒', keywords: ['unamused', 'annoyed'] },
    { emoji: '🙄', keywords: ['eye', 'roll', 'annoyed'] },
    { emoji: '😬', keywords: ['grimace', 'awkward'] },
    { emoji: '🤥', keywords: ['lie', 'pinocchio', 'nose'] },
    { emoji: '😌', keywords: ['relieved', 'peaceful'] },
    { emoji: '😔', keywords: ['sad', 'pensive'] },
    { emoji: '😪', keywords: ['sleepy', 'tired'] },
    { emoji: '🤤', keywords: ['drool', 'sleep'] },
    { emoji: '😴', keywords: ['sleep', 'zzz'] },
    { emoji: '😷', keywords: ['mask', 'sick', 'medical'] },
    { emoji: '🤒', keywords: ['sick', 'thermometer', 'fever'] },
    { emoji: '🤕', keywords: ['hurt', 'injured', 'bandage'] },
    { emoji: '🤢', keywords: ['nausea', 'sick', 'disgusted'] },
    { emoji: '🤮', keywords: ['vomit', 'sick', 'puke'] },
    { emoji: '🤧', keywords: ['sneeze', 'sick', 'tissue'] },
    { emoji: '🥵', keywords: ['hot', 'sweating'] },
    { emoji: '🥶', keywords: ['cold', 'freezing'] },
    { emoji: '🥴', keywords: ['dizzy', 'drunk', 'woozy'] },
    { emoji: '😵', keywords: ['dizzy', 'knocked', 'out'] },
    { emoji: '🤯', keywords: ['mind', 'blown', 'explode'] },
    { emoji: '🤠', keywords: ['cowboy', 'hat'] },
    { emoji: '🥳', keywords: ['party', 'celebrate', 'birthday'] },
    { emoji: '😎', keywords: ['cool', 'sunglasses'] },
    { emoji: '🤓', keywords: ['nerd', 'geek', 'glasses'] }
  ],
  'Gestures': [
    { emoji: '👋', keywords: ['wave', 'hello', 'hi', 'bye'] },
    { emoji: '🤚', keywords: ['hand', 'raised', 'back'] },
    { emoji: '🖐', keywords: ['hand', 'five', 'fingers'] },
    { emoji: '✋', keywords: ['hand', 'stop', 'halt'] },
    { emoji: '🖖', keywords: ['vulcan', 'spock', 'star', 'trek'] },
    { emoji: '👌', keywords: ['ok', 'okay', 'perfect'] },
    { emoji: '🤏', keywords: ['pinch', 'small', 'tiny'] },
    { emoji: '✌', keywords: ['peace', 'victory', 'two'] },
    { emoji: '🤞', keywords: ['fingers', 'crossed', 'luck'] },
    { emoji: '🤟', keywords: ['love', 'you', 'hand'] },
    { emoji: '🤘', keywords: ['rock', 'on', 'metal'] },
    { emoji: '🤙', keywords: ['call', 'me', 'shaka'] },
    { emoji: '👈', keywords: ['point', 'left'] },
    { emoji: '👉', keywords: ['point', 'right'] },
    { emoji: '👆', keywords: ['point', 'up'] },
    { emoji: '🖕', keywords: ['middle', 'finger'] },
    { emoji: '👇', keywords: ['point', 'down'] },
    { emoji: '☝', keywords: ['point', 'up', 'index'] },
    { emoji: '👍', keywords: ['thumbs', 'up', 'yes', 'good'] },
    { emoji: '👎', keywords: ['thumbs', 'down', 'no', 'bad'] },
    { emoji: '✊', keywords: ['fist', 'punch'] },
    { emoji: '👊', keywords: ['fist', 'bump', 'punch'] },
    { emoji: '🤛', keywords: ['fist', 'bump', 'left'] },
    { emoji: '🤜', keywords: ['fist', 'bump', 'right'] },
    { emoji: '👏', keywords: ['clap', 'applause', 'bravo'] },
    { emoji: '🙌', keywords: ['hands', 'up', 'celebration', 'praise'] },
    { emoji: '👐', keywords: ['open', 'hands'] },
    { emoji: '🤲', keywords: ['palms', 'up', 'together'] },
    { emoji: '🤝', keywords: ['handshake', 'deal', 'agreement'] },
    { emoji: '🙏', keywords: ['pray', 'please', 'thank', 'you', 'namaste'] },
    { emoji: '✍', keywords: ['write', 'writing'] },
    { emoji: '💅', keywords: ['nail', 'polish', 'manicure'] },
    { emoji: '🤳', keywords: ['selfie', 'phone'] },
    { emoji: '💪', keywords: ['muscle', 'strong', 'flex'] },
    { emoji: '🦾', keywords: ['mechanical', 'arm'] },
    { emoji: '🦿', keywords: ['mechanical', 'leg'] },
    { emoji: '🦵', keywords: ['leg', 'kick'] },
    { emoji: '🦶', keywords: ['foot', 'feet'] },
    { emoji: '👂', keywords: ['ear', 'listen'] },
    { emoji: '🦻', keywords: ['ear', 'hearing', 'aid'] },
    { emoji: '👃', keywords: ['nose', 'smell'] },
    { emoji: '🧠', keywords: ['brain', 'smart'] },
    { emoji: '🦷', keywords: ['tooth', 'dental'] },
    { emoji: '🦴', keywords: ['bone'] },
    { emoji: '👀', keywords: ['eyes', 'look', 'see', 'watch'] },
    { emoji: '👁', keywords: ['eye', 'look'] },
    { emoji: '👅', keywords: ['tongue', 'taste'] },
    { emoji: '👄', keywords: ['lips', 'mouth', 'kiss'] }
  ],
  'Animals': [
    { emoji: '🐶', keywords: ['dog', 'puppy', 'pet'] },
    { emoji: '🐱', keywords: ['cat', 'kitten', 'pet'] },
    { emoji: '🐭', keywords: ['mouse', 'rat'] },
    { emoji: '🐹', keywords: ['hamster', 'pet'] },
    { emoji: '🐰', keywords: ['rabbit', 'bunny'] },
    { emoji: '🦊', keywords: ['fox'] },
    { emoji: '🐻', keywords: ['bear'] },
    { emoji: '🐼', keywords: ['panda', 'bear'] },
    { emoji: '🐨', keywords: ['koala'] },
    { emoji: '🐯', keywords: ['tiger'] },
    { emoji: '🦁', keywords: ['lion', 'king'] },
    { emoji: '🐮', keywords: ['cow'] },
    { emoji: '🐷', keywords: ['pig'] },
    { emoji: '🐽', keywords: ['pig', 'nose'] },
    { emoji: '🐸', keywords: ['frog'] },
    { emoji: '🐵', keywords: ['monkey'] },
    { emoji: '🙈', keywords: ['monkey', 'see', 'no', 'evil'] },
    { emoji: '🙉', keywords: ['monkey', 'hear', 'no', 'evil'] },
    { emoji: '🙊', keywords: ['monkey', 'speak', 'no', 'evil'] },
    { emoji: '🐒', keywords: ['monkey'] },
    { emoji: '🐔', keywords: ['chicken'] },
    { emoji: '🐧', keywords: ['penguin'] },
    { emoji: '🐦', keywords: ['bird'] },
    { emoji: '🐤', keywords: ['chick', 'baby', 'bird'] },
    { emoji: '🐣', keywords: ['chick', 'hatching'] },
    { emoji: '🐥', keywords: ['chick', 'baby'] },
    { emoji: '🦆', keywords: ['duck'] },
    { emoji: '🦅', keywords: ['eagle'] },
    { emoji: '🦉', keywords: ['owl'] },
    { emoji: '🦇', keywords: ['bat', 'vampire'] },
    { emoji: '🐺', keywords: ['wolf'] },
    { emoji: '🐗', keywords: ['boar', 'pig'] },
    { emoji: '🐴', keywords: ['horse'] },
    { emoji: '🦄', keywords: ['unicorn', 'magic'] },
    { emoji: '🐝', keywords: ['bee', 'honey'] },
    { emoji: '🐛', keywords: ['bug', 'caterpillar'] },
    { emoji: '🦋', keywords: ['butterfly'] },
    { emoji: '🐌', keywords: ['snail', 'slow'] },
    { emoji: '🐞', keywords: ['ladybug', 'beetle'] },
    { emoji: '🐜', keywords: ['ant'] },
    { emoji: '🦟', keywords: ['mosquito'] },
    { emoji: '🦗', keywords: ['cricket'] },
    { emoji: '🕷', keywords: ['spider'] },
    { emoji: '🦂', keywords: ['scorpion'] },
    { emoji: '🐢', keywords: ['turtle'] },
    { emoji: '🐍', keywords: ['snake'] },
    { emoji: '🦎', keywords: ['lizard'] },
    { emoji: '🦖', keywords: ['dinosaur', 't-rex'] }
  ],
  'Food': [
    { emoji: '🍎', keywords: ['apple', 'red', 'fruit'] },
    { emoji: '🍐', keywords: ['pear', 'fruit'] },
    { emoji: '🍊', keywords: ['orange', 'fruit', 'citrus'] },
    { emoji: '🍋', keywords: ['lemon', 'citrus', 'sour'] },
    { emoji: '🍌', keywords: ['banana', 'fruit'] },
    { emoji: '🍉', keywords: ['watermelon', 'fruit'] },
    { emoji: '🍇', keywords: ['grapes', 'fruit', 'wine'] },
    { emoji: '🍓', keywords: ['strawberry', 'fruit', 'berry'] },
    { emoji: '🍈', keywords: ['melon', 'fruit'] },
    { emoji: '🍒', keywords: ['cherry', 'fruit'] },
    { emoji: '🍑', keywords: ['peach', 'fruit'] },
    { emoji: '🥭', keywords: ['mango', 'fruit'] },
    { emoji: '🍍', keywords: ['pineapple', 'fruit'] },
    { emoji: '🥥', keywords: ['coconut', 'fruit'] },
    { emoji: '🥝', keywords: ['kiwi', 'fruit'] },
    { emoji: '🍅', keywords: ['tomato', 'vegetable'] },
    { emoji: '🍆', keywords: ['eggplant', 'vegetable'] },
    { emoji: '🥑', keywords: ['avocado', 'fruit'] },
    { emoji: '🥦', keywords: ['broccoli', 'vegetable'] },
    { emoji: '🥬', keywords: ['lettuce', 'vegetable', 'leafy'] },
    { emoji: '🥒', keywords: ['cucumber', 'vegetable'] },
    { emoji: '🌶', keywords: ['pepper', 'hot', 'spicy'] },
    { emoji: '🌽', keywords: ['corn', 'vegetable'] },
    { emoji: '🥕', keywords: ['carrot', 'vegetable'] },
    { emoji: '🧄', keywords: ['garlic', 'vegetable'] },
    { emoji: '🧅', keywords: ['onion', 'vegetable'] },
    { emoji: '🥔', keywords: ['potato', 'vegetable'] },
    { emoji: '🍠', keywords: ['sweet', 'potato', 'yam'] },
    { emoji: '🥐', keywords: ['croissant', 'bread', 'french'] },
    { emoji: '🥯', keywords: ['bagel', 'bread'] },
    { emoji: '🍞', keywords: ['bread', 'toast'] },
    { emoji: '🥖', keywords: ['baguette', 'bread', 'french'] },
    { emoji: '🥨', keywords: ['pretzel', 'bread'] },
    { emoji: '🧀', keywords: ['cheese'] },
    { emoji: '🥚', keywords: ['egg'] },
    { emoji: '🍳', keywords: ['cooking', 'egg', 'fried'] },
    { emoji: '🧈', keywords: ['butter'] },
    { emoji: '🥞', keywords: ['pancakes', 'breakfast'] },
    { emoji: '🧇', keywords: ['waffle', 'breakfast'] },
    { emoji: '🥓', keywords: ['bacon', 'breakfast'] },
    { emoji: '🥩', keywords: ['meat', 'steak'] },
    { emoji: '🍗', keywords: ['chicken', 'meat', 'leg'] },
    { emoji: '🍖', keywords: ['meat', 'bone'] },
    { emoji: '🦴', keywords: ['bone'] },
    { emoji: '🌭', keywords: ['hot', 'dog', 'hotdog'] },
    { emoji: '🍔', keywords: ['burger', 'hamburger'] },
    { emoji: '🍟', keywords: ['fries', 'french', 'potato'] },
    { emoji: '🍕', keywords: ['pizza', 'slice'] }
  ],
  'Activities': [
    { emoji: '⚽', keywords: ['soccer', 'football', 'ball', 'sport'] },
    { emoji: '🏀', keywords: ['basketball', 'ball', 'sport'] },
    { emoji: '🏈', keywords: ['football', 'american', 'ball', 'sport'] },
    { emoji: '⚾', keywords: ['baseball', 'ball', 'sport'] },
    { emoji: '🥎', keywords: ['softball', 'ball', 'sport'] },
    { emoji: '🎾', keywords: ['tennis', 'ball', 'sport'] },
    { emoji: '🏐', keywords: ['volleyball', 'ball', 'sport'] },
    { emoji: '🏉', keywords: ['rugby', 'ball', 'sport'] },
    { emoji: '🥏', keywords: ['frisbee', 'disc'] },
    { emoji: '🎱', keywords: ['pool', 'billiards', '8', 'ball'] },
    { emoji: '🪀', keywords: ['yoyo', 'toy'] },
    { emoji: '🏓', keywords: ['ping', 'pong', 'table', 'tennis'] },
    { emoji: '🏸', keywords: ['badminton', 'sport'] },
    { emoji: '🏒', keywords: ['hockey', 'ice', 'sport'] },
    { emoji: '🏑', keywords: ['hockey', 'field', 'sport'] },
    { emoji: '🥍', keywords: ['lacrosse', 'sport'] },
    { emoji: '🏏', keywords: ['cricket', 'sport'] },
    { emoji: '🥅', keywords: ['goal', 'net', 'sport'] },
    { emoji: '⛳', keywords: ['golf', 'flag', 'sport'] },
    { emoji: '🪁', keywords: ['kite', 'fly'] },
    { emoji: '🏹', keywords: ['archery', 'bow', 'arrow'] },
    { emoji: '🎣', keywords: ['fishing', 'fish', 'pole'] },
    { emoji: '🤿', keywords: ['diving', 'snorkel', 'mask'] },
    { emoji: '🥊', keywords: ['boxing', 'glove', 'sport'] },
    { emoji: '🥋', keywords: ['martial', 'arts', 'karate', 'judo'] },
    { emoji: '🎽', keywords: ['running', 'shirt', 'sport'] },
    { emoji: '🛹', keywords: ['skateboard', 'sport'] },
    { emoji: '🛷', keywords: ['sled', 'sledding'] },
    { emoji: '⛸', keywords: ['ice', 'skate', 'skating'] },
    { emoji: '🥌', keywords: ['curling', 'stone', 'sport'] },
    { emoji: '🎿', keywords: ['ski', 'skiing', 'sport'] },
    { emoji: '⛷', keywords: ['skier', 'skiing', 'sport'] },
    { emoji: '🏂', keywords: ['snowboard', 'snowboarding', 'sport'] },
    { emoji: '🪂', keywords: ['parachute', 'skydiving'] },
    { emoji: '🏋', keywords: ['weight', 'lifting', 'gym'] },
    { emoji: '🤼', keywords: ['wrestling', 'sport'] },
    { emoji: '🤸', keywords: ['cartwheel', 'gymnastics'] },
    { emoji: '🤺', keywords: ['fencing', 'sport'] },
    { emoji: '🤾', keywords: ['handball', 'sport'] },
    { emoji: '🏌', keywords: ['golf', 'golfer', 'sport'] },
    { emoji: '🏇', keywords: ['horse', 'racing', 'sport'] },
    { emoji: '🧘', keywords: ['yoga', 'meditation', 'zen'] },
    { emoji: '🏄', keywords: ['surf', 'surfing', 'sport'] },
    { emoji: '🏊', keywords: ['swim', 'swimming', 'sport'] },
    { emoji: '🤽', keywords: ['water', 'polo', 'sport'] },
    { emoji: '🚣', keywords: ['rowing', 'boat', 'sport'] },
    { emoji: '🧗', keywords: ['climbing', 'climb', 'sport'] },
    { emoji: '🚴', keywords: ['bike', 'biking', 'cycling', 'sport'] }
  ],
  'Objects': [
    { emoji: '⌚', keywords: ['watch', 'time', 'clock'] },
    { emoji: '📱', keywords: ['phone', 'mobile', 'cell'] },
    { emoji: '📲', keywords: ['phone', 'call', 'mobile'] },
    { emoji: '💻', keywords: ['laptop', 'computer', 'pc'] },
    { emoji: '⌨', keywords: ['keyboard', 'typing'] },
    { emoji: '🖥', keywords: ['desktop', 'computer', 'monitor'] },
    { emoji: '🖨', keywords: ['printer', 'print'] },
    { emoji: '🖱', keywords: ['mouse', 'computer'] },
    { emoji: '🖲', keywords: ['trackball'] },
    { emoji: '🕹', keywords: ['joystick', 'game'] },
    { emoji: '🗜', keywords: ['clamp', 'tool'] },
    { emoji: '💾', keywords: ['floppy', 'disk', 'save'] },
    { emoji: '💿', keywords: ['cd', 'disc'] },
    { emoji: '📀', keywords: ['dvd', 'disc'] },
    { emoji: '📼', keywords: ['vhs', 'video', 'tape'] },
    { emoji: '📷', keywords: ['camera', 'photo'] },
    { emoji: '📸', keywords: ['camera', 'flash', 'photo'] },
    { emoji: '📹', keywords: ['video', 'camera'] },
    { emoji: '🎥', keywords: ['movie', 'camera', 'film'] },
    { emoji: '📽', keywords: ['projector', 'film'] },
    { emoji: '🎞', keywords: ['film', 'frames'] },
    { emoji: '📞', keywords: ['phone', 'receiver', 'call'] },
    { emoji: '☎', keywords: ['phone', 'telephone'] },
    { emoji: '📟', keywords: ['pager', 'beeper'] },
    { emoji: '📠', keywords: ['fax', 'machine'] },
    { emoji: '📺', keywords: ['tv', 'television'] },
    { emoji: '📻', keywords: ['radio'] },
    { emoji: '🎙', keywords: ['microphone', 'mic', 'podcast'] },
    { emoji: '🎚', keywords: ['level', 'slider'] },
    { emoji: '🎛', keywords: ['control', 'knobs'] },
    { emoji: '🧭', keywords: ['compass', 'navigation'] },
    { emoji: '⏱', keywords: ['stopwatch', 'timer'] },
    { emoji: '⏲', keywords: ['timer', 'clock'] },
    { emoji: '⏰', keywords: ['alarm', 'clock'] },
    { emoji: '🕰', keywords: ['clock', 'mantle'] },
    { emoji: '⌛', keywords: ['hourglass', 'timer', 'time'] },
    { emoji: '⏳', keywords: ['hourglass', 'timer', 'flowing'] },
    { emoji: '📡', keywords: ['satellite', 'antenna'] },
    { emoji: '🔋', keywords: ['battery', 'power'] },
    { emoji: '🔌', keywords: ['plug', 'electric'] },
    { emoji: '💡', keywords: ['light', 'bulb', 'idea'] },
    { emoji: '🔦', keywords: ['flashlight', 'torch'] },
    { emoji: '🕯', keywords: ['candle', 'light'] },
    { emoji: '🪔', keywords: ['lamp', 'diya'] },
    { emoji: '🧯', keywords: ['fire', 'extinguisher'] },
    { emoji: '🛢', keywords: ['oil', 'drum', 'barrel'] },
    { emoji: '💸', keywords: ['money', 'flying', 'cash'] },
    { emoji: '💵', keywords: ['dollar', 'money', 'bill'] }
  ],
  'Symbols': [
    { emoji: '❤️', keywords: ['heart', 'love', 'red'] },
    { emoji: '🧡', keywords: ['heart', 'orange', 'love'] },
    { emoji: '💛', keywords: ['heart', 'yellow', 'love'] },
    { emoji: '💚', keywords: ['heart', 'green', 'love'] },
    { emoji: '💙', keywords: ['heart', 'blue', 'love'] },
    { emoji: '💜', keywords: ['heart', 'purple', 'love'] },
    { emoji: '🖤', keywords: ['heart', 'black', 'love'] },
    { emoji: '🤍', keywords: ['heart', 'white', 'love'] },
    { emoji: '🤎', keywords: ['heart', 'brown', 'love'] },
    { emoji: '💔', keywords: ['broken', 'heart', 'sad'] },
    { emoji: '❣', keywords: ['heart', 'exclamation'] },
    { emoji: '💕', keywords: ['two', 'hearts', 'love'] },
    { emoji: '💞', keywords: ['revolving', 'hearts', 'love'] },
    { emoji: '💓', keywords: ['beating', 'heart', 'love'] },
    { emoji: '💗', keywords: ['growing', 'heart', 'love'] },
    { emoji: '💖', keywords: ['sparkling', 'heart', 'love'] },
    { emoji: '💘', keywords: ['heart', 'arrow', 'cupid', 'love'] },
    { emoji: '💝', keywords: ['heart', 'box', 'gift', 'love'] },
    { emoji: '💟', keywords: ['heart', 'decoration'] },
    { emoji: '☮', keywords: ['peace', 'symbol'] },
    { emoji: '✝', keywords: ['cross', 'christian'] },
    { emoji: '☪', keywords: ['star', 'crescent', 'islam'] },
    { emoji: '🕉', keywords: ['om', 'hindu'] },
    { emoji: '☸', keywords: ['wheel', 'dharma', 'buddhist'] },
    { emoji: '✡', keywords: ['star', 'david', 'jewish'] },
    { emoji: '🔯', keywords: ['star', 'six', 'pointed'] },
    { emoji: '🕎', keywords: ['menorah', 'jewish'] },
    { emoji: '☯', keywords: ['yin', 'yang'] },
    { emoji: '☦', keywords: ['cross', 'orthodox'] },
    { emoji: '🛐', keywords: ['worship', 'place'] },
    { emoji: '⛎', keywords: ['ophiuchus', 'zodiac'] },
    { emoji: '♈', keywords: ['aries', 'zodiac', 'ram'] },
    { emoji: '♉', keywords: ['taurus', 'zodiac', 'bull'] },
    { emoji: '♊', keywords: ['gemini', 'zodiac', 'twins'] },
    { emoji: '♋', keywords: ['cancer', 'zodiac', 'crab'] },
    { emoji: '♌', keywords: ['leo', 'zodiac', 'lion'] },
    { emoji: '♍', keywords: ['virgo', 'zodiac'] },
    { emoji: '♎', keywords: ['libra', 'zodiac', 'scales'] },
    { emoji: '♏', keywords: ['scorpio', 'zodiac', 'scorpion'] },
    { emoji: '♐', keywords: ['sagittarius', 'zodiac', 'archer'] },
    { emoji: '♑', keywords: ['capricorn', 'zodiac', 'goat'] },
    { emoji: '♒', keywords: ['aquarius', 'zodiac', 'water'] },
    { emoji: '♓', keywords: ['pisces', 'zodiac', 'fish'] },
    { emoji: '🆔', keywords: ['id', 'identity'] },
    { emoji: '⚛', keywords: ['atom', 'science'] },
    { emoji: '🉑', keywords: ['accept', 'japanese'] },
    { emoji: '☢', keywords: ['radioactive', 'danger'] },
    { emoji: '☣', keywords: ['biohazard', 'danger'] }
  ],
  'Nature': [
    { emoji: '🌍', keywords: ['earth', 'globe', 'europe', 'africa'] },
    { emoji: '🌎', keywords: ['earth', 'globe', 'americas'] },
    { emoji: '🌏', keywords: ['earth', 'globe', 'asia'] },
    { emoji: '🌐', keywords: ['globe', 'world', 'internet'] },
    { emoji: '🗺', keywords: ['map', 'world'] },
    { emoji: '🗾', keywords: ['japan', 'map'] },
    { emoji: '🧭', keywords: ['compass', 'navigation'] },
    { emoji: '🏔', keywords: ['mountain', 'snow'] },
    { emoji: '⛰', keywords: ['mountain'] },
    { emoji: '🌋', keywords: ['volcano', 'eruption'] },
    { emoji: '🗻', keywords: ['mount', 'fuji', 'mountain'] },
    { emoji: '🏕', keywords: ['camping', 'camp', 'tent'] },
    { emoji: '🏖', keywords: ['beach', 'umbrella', 'sand'] },
    { emoji: '🏜', keywords: ['desert', 'sand'] },
    { emoji: '🏝', keywords: ['island', 'desert'] },
    { emoji: '🏞', keywords: ['park', 'national', 'nature'] },
    { emoji: '🏟', keywords: ['stadium', 'sports'] },
    { emoji: '🏛', keywords: ['building', 'classical'] },
    { emoji: '🏗', keywords: ['construction', 'building'] },
    { emoji: '🧱', keywords: ['brick', 'wall'] },
    { emoji: '🪨', keywords: ['rock', 'stone'] },
    { emoji: '🪵', keywords: ['wood', 'log'] },
    { emoji: '🛖', keywords: ['hut', 'house'] },
    { emoji: '🏘', keywords: ['houses', 'buildings'] },
    { emoji: '🏚', keywords: ['house', 'derelict', 'abandoned'] },
    { emoji: '🏠', keywords: ['house', 'home'] },
    { emoji: '🏡', keywords: ['house', 'garden', 'home'] },
    { emoji: '🏢', keywords: ['office', 'building'] },
    { emoji: '🏣', keywords: ['post', 'office', 'japanese'] },
    { emoji: '🏤', keywords: ['post', 'office'] },
    { emoji: '🏥', keywords: ['hospital', 'medical'] },
    { emoji: '🏦', keywords: ['bank', 'money'] },
    { emoji: '🏨', keywords: ['hotel', 'building'] },
    { emoji: '🏩', keywords: ['love', 'hotel'] },
    { emoji: '🏪', keywords: ['store', 'shop', 'convenience'] },
    { emoji: '🏫', keywords: ['school', 'education'] },
    { emoji: '🏬', keywords: ['store', 'department', 'shop'] },
    { emoji: '🏭', keywords: ['factory', 'building'] },
    { emoji: '🏯', keywords: ['castle', 'japanese'] },
    { emoji: '🏰', keywords: ['castle', 'european'] },
    { emoji: '💒', keywords: ['wedding', 'church', 'chapel'] },
    { emoji: '🗼', keywords: ['tower', 'tokyo'] },
    { emoji: '🗽', keywords: ['statue', 'liberty', 'new', 'york'] },
    { emoji: '⛪', keywords: ['church', 'christian'] },
    { emoji: '🕌', keywords: ['mosque', 'islam'] },
    { emoji: '🛕', keywords: ['temple', 'hindu'] },
    { emoji: '🕍', keywords: ['synagogue', 'jewish'] },
    { emoji: '⛩', keywords: ['shrine', 'shinto', 'japanese'] }
  ],
  'Travel': [
    { emoji: '🚗', keywords: ['car', 'automobile', 'vehicle'] },
    { emoji: '🚕', keywords: ['taxi', 'cab'] },
    { emoji: '🚙', keywords: ['suv', 'car'] },
    { emoji: '🚌', keywords: ['bus', 'vehicle'] },
    { emoji: '🚎', keywords: ['trolley', 'bus'] },
    { emoji: '🏎', keywords: ['race', 'car', 'fast'] },
    { emoji: '🚓', keywords: ['police', 'car', 'cop'] },
    { emoji: '🚑', keywords: ['ambulance', 'emergency'] },
    { emoji: '🚒', keywords: ['fire', 'truck', 'engine'] },
    { emoji: '🚐', keywords: ['minibus', 'van'] },
    { emoji: '🛻', keywords: ['pickup', 'truck'] },
    { emoji: '🚚', keywords: ['truck', 'delivery'] },
    { emoji: '🚛', keywords: ['truck', 'semi'] },
    { emoji: '🚜', keywords: ['tractor', 'farm'] },
    { emoji: '🏍', keywords: ['motorcycle', 'bike'] },
    { emoji: '🛵', keywords: ['scooter', 'motor'] },
    { emoji: '🚲', keywords: ['bicycle', 'bike', 'cycle'] },
    { emoji: '✈️', keywords: ['airplane', 'plane', 'flight'] },
    { emoji: '🚁', keywords: ['helicopter', 'chopper'] },
    { emoji: '🚂', keywords: ['train', 'locomotive'] },
    { emoji: '🚆', keywords: ['train', 'railway'] },
    { emoji: '🚇', keywords: ['metro', 'subway'] },
    { emoji: '🚊', keywords: ['tram', 'streetcar'] },
    { emoji: '🚝', keywords: ['monorail', 'train'] },
    { emoji: '🚄', keywords: ['bullet', 'train', 'fast'] },
    { emoji: '🚅', keywords: ['bullet', 'train', 'shinkansen'] },
    { emoji: '🚈', keywords: ['light', 'rail', 'train'] },
    { emoji: '🚞', keywords: ['mountain', 'railway'] },
    { emoji: '🚋', keywords: ['tram', 'car'] },
    { emoji: '🚃', keywords: ['railway', 'car'] },
    { emoji: '🚟', keywords: ['suspension', 'railway'] },
    { emoji: '🚠', keywords: ['cable', 'car', 'mountain'] },
    { emoji: '🚡', keywords: ['aerial', 'tramway'] },
    { emoji: '🛰', keywords: ['satellite', 'space'] },
    { emoji: '🚀', keywords: ['rocket', 'space', 'launch'] },
    { emoji: '🛸', keywords: ['ufo', 'alien', 'flying', 'saucer'] },
    { emoji: '⛵', keywords: ['sailboat', 'boat', 'sailing'] },
    { emoji: '🛶', keywords: ['canoe', 'boat'] },
    { emoji: '🚤', keywords: ['speedboat', 'boat', 'fast'] },
    { emoji: '🛳', keywords: ['cruise', 'ship'] },
    { emoji: '⛴', keywords: ['ferry', 'boat'] },
    { emoji: '🛥', keywords: ['motor', 'boat'] },
    { emoji: '🚢', keywords: ['ship', 'boat'] },
    { emoji: '⚓', keywords: ['anchor', 'ship'] },
    { emoji: '⛽', keywords: ['fuel', 'gas', 'pump'] },
    { emoji: '🚧', keywords: ['construction', 'warning'] },
    { emoji: '🚦', keywords: ['traffic', 'light', 'signal'] },
    { emoji: '🚥', keywords: ['traffic', 'light'] }
  ],
  'Weather': [
    { emoji: '☀️', keywords: ['sun', 'sunny', 'bright'] },
    { emoji: '🌤', keywords: ['sun', 'cloud', 'partly'] },
    { emoji: '⛅', keywords: ['cloud', 'sun'] },
    { emoji: '🌥', keywords: ['cloud', 'sun'] },
    { emoji: '☁️', keywords: ['cloud', 'cloudy'] },
    { emoji: '🌦', keywords: ['sun', 'rain', 'cloud'] },
    { emoji: '🌧', keywords: ['rain', 'cloud'] },
    { emoji: '⛈', keywords: ['storm', 'thunder', 'rain'] },
    { emoji: '🌩', keywords: ['cloud', 'lightning'] },
    { emoji: '🌨', keywords: ['snow', 'cloud'] },
    { emoji: '❄️', keywords: ['snowflake', 'snow', 'cold'] },
    { emoji: '☃️', keywords: ['snowman', 'snow'] },
    { emoji: '⛄', keywords: ['snowman', 'snow'] },
    { emoji: '🌬', keywords: ['wind', 'blow'] },
    { emoji: '💨', keywords: ['dash', 'wind', 'fast'] },
    { emoji: '🌪', keywords: ['tornado', 'cyclone'] },
    { emoji: '🌫', keywords: ['fog', 'mist'] },
    { emoji: '🌈', keywords: ['rainbow', 'colorful'] },
    { emoji: '☔', keywords: ['umbrella', 'rain'] },
    { emoji: '⚡', keywords: ['lightning', 'bolt', 'electric'] },
    { emoji: '🔥', keywords: ['fire', 'flame', 'hot'] },
    { emoji: '💧', keywords: ['droplet', 'water'] },
    { emoji: '🌊', keywords: ['wave', 'water', 'ocean'] }
  ],
  'Celebration': [
    { emoji: '🎉', keywords: ['party', 'celebration', 'tada'] },
    { emoji: '🎊', keywords: ['confetti', 'ball', 'party'] },
    { emoji: '🎈', keywords: ['balloon', 'party'] },
    { emoji: '🎁', keywords: ['gift', 'present', 'box'] },
    { emoji: '🎀', keywords: ['ribbon', 'bow', 'gift'] },
    { emoji: '🎂', keywords: ['cake', 'birthday'] },
    { emoji: '🍰', keywords: ['cake', 'slice', 'dessert'] },
    { emoji: '🧁', keywords: ['cupcake', 'cake'] },
    { emoji: '🥳', keywords: ['party', 'celebrate', 'birthday'] },
    { emoji: '🎆', keywords: ['fireworks', 'celebration'] },
    { emoji: '🎇', keywords: ['sparkler', 'fireworks'] },
    { emoji: '✨', keywords: ['sparkles', 'stars', 'shine'] },
    { emoji: '🎃', keywords: ['halloween', 'pumpkin'] },
    { emoji: '🎄', keywords: ['christmas', 'tree'] },
    { emoji: '🎅', keywords: ['santa', 'christmas'] },
    { emoji: '🤶', keywords: ['mrs', 'claus', 'christmas'] },
    { emoji: '🎁', keywords: ['gift', 'present'] },
    { emoji: '🔔', keywords: ['bell', 'christmas'] },
    { emoji: '🕎', keywords: ['menorah', 'hanukkah'] },
    { emoji: '🎋', keywords: ['tanabata', 'tree'] },
    { emoji: '🎍', keywords: ['pine', 'decoration'] },
    { emoji: '🎏', keywords: ['carp', 'streamer'] },
    { emoji: '🎐', keywords: ['wind', 'chime'] },
    { emoji: '🧧', keywords: ['red', 'envelope', 'gift'] },
    { emoji: '🎑', keywords: ['moon', 'ceremony'] },
    { emoji: '🎆', keywords: ['fireworks'] },
    { emoji: '🎇', keywords: ['sparkler'] }
  ],
  'Music': [
    { emoji: '🎵', keywords: ['music', 'note'] },
    { emoji: '🎶', keywords: ['music', 'notes', 'song'] },
    { emoji: '🎼', keywords: ['musical', 'score'] },
    { emoji: '🎹', keywords: ['piano', 'keyboard', 'music'] },
    { emoji: '🎸', keywords: ['guitar', 'rock', 'music'] },
    { emoji: '🎺', keywords: ['trumpet', 'music'] },
    { emoji: '.sax', keywords: ['saxophone', 'sax', 'music'] },
    { emoji: '🎻', keywords: ['violin', 'music'] },
    { emoji: '🥁', keywords: ['drum', 'music'] },
    { emoji: '🎤', keywords: ['microphone', 'sing', 'karaoke'] },
    { emoji: '🎧', keywords: ['headphones', 'music'] },
    { emoji: '🎬', keywords: ['movie', 'clapper', 'film'] },
    { emoji: '🎭', keywords: ['theater', 'drama', 'masks'] },
    { emoji: '🎪', keywords: ['circus', 'tent'] },
    { emoji: '🎨', keywords: ['art', 'palette', 'paint'] }
  ],
  'Tech': [
    { emoji: '💻', keywords: ['laptop', 'computer', 'work'] },
    { emoji: '🖥', keywords: ['desktop', 'computer', 'monitor'] },
    { emoji: '⌨️', keywords: ['keyboard', 'typing'] },
    { emoji: '🖱', keywords: ['mouse', 'computer'] },
    { emoji: '🖨', keywords: ['printer', 'print'] },
    { emoji: '📱', keywords: ['phone', 'mobile', 'smartphone'] },
    { emoji: '☎️', keywords: ['telephone', 'phone'] },
    { emoji: '📞', keywords: ['phone', 'receiver'] },
    { emoji: '📟', keywords: ['pager', 'beeper'] },
    { emoji: '📠', keywords: ['fax', 'machine'] },
    { emoji: '📡', keywords: ['satellite', 'antenna'] },
    { emoji: '🔋', keywords: ['battery', 'power'] },
    { emoji: '🔌', keywords: ['plug', 'electric', 'power'] },
    { emoji: '💡', keywords: ['light', 'bulb', 'idea', 'bright'] },
    { emoji: '🔦', keywords: ['flashlight', 'torch'] },
    { emoji: '🕯', keywords: ['candle', 'light'] },
    { emoji: '💾', keywords: ['floppy', 'disk', 'save'] },
    { emoji: '💿', keywords: ['cd', 'disc'] },
    { emoji: '📀', keywords: ['dvd', 'disc'] },
    { emoji: '🎮', keywords: ['game', 'controller', 'gaming'] },
    { emoji: '🕹', keywords: ['joystick', 'game'] },
    { emoji: '📷', keywords: ['camera', 'photo'] },
    { emoji: '📸', keywords: ['camera', 'flash'] },
    { emoji: '📹', keywords: ['video', 'camera'] },
    { emoji: '🎥', keywords: ['movie', 'camera', 'film'] },
    { emoji: '📺', keywords: ['tv', 'television'] },
    { emoji: '📻', keywords: ['radio', 'music'] },
    { emoji: '🎙', keywords: ['microphone', 'podcast', 'studio'] },
    { emoji: '⏰', keywords: ['alarm', 'clock', 'time'] },
    { emoji: '⌚', keywords: ['watch', 'time'] },
    { emoji: '⏱', keywords: ['stopwatch', 'timer'] },
    { emoji: '⏲', keywords: ['timer', 'clock'] }
  ]
};

export function StickerPicker({ open, onClose, onSelectSticker }: StickerPickerProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Emotions');
  const [stickerPacks, setStickerPacks] = useState<Record<string, StickerPack>>({});
  const [viewMode, setViewMode] = useState<'emojis' | 'custom'>('emojis');
  const [creatingPack, setCreatingPack] = useState(false);
  const [newPackName, setNewPackName] = useState('');

  useEffect(() => {
    if (open && viewMode === 'custom') {
      loadStickerPacks();
    }
  }, [open, viewMode]);

  const loadStickerPacks = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/kv/prefix/sticker-pack-`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const packs: Record<string, StickerPack> = {};

        for (const item of (data.values || [])) {
          if (item && item.key && item.value) {
            const packName = item.key.replace('sticker-pack-', '');
            packs[packName] = item.value;
          }
        }

        setStickerPacks(packs);
      }
    } catch (error) {
      console.error("Failed to load sticker packs:", error);
    }
  };

  const handleSelectSticker = (sticker: string) => {
    onSelectSticker(sticker);
    onClose();
  };

  const filteredStickers = searchQuery
    ? Object.values(STICKER_CATEGORIES).flat().filter(sticker => sticker.keywords.some(keyword => keyword.includes(searchQuery.toLowerCase())))
    : STICKER_CATEGORIES[selectedCategory as keyof typeof STICKER_CATEGORIES];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-gray-800 border-2 border-blue-200 dark:border-blue-900">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Choose a Sticker 🎨
          </DialogTitle>
          <DialogDescription>
            Select an emoji or create a custom sticker pack
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              onClick={() => setViewMode('emojis')}
              className={`flex-1 ${viewMode === 'emojis' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
            >
              Emojis
            </Button>
            <Button
              onClick={() => setViewMode('custom')}
              className={`flex-1 ${viewMode === 'custom' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
            >
              Custom Stickers
            </Button>
          </div>

          {viewMode === 'emojis' ? (
            <>
              <Input
                placeholder="Search emojis... 🔍"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border-2 border-blue-200 dark:border-blue-800 focus:border-blue-500 dark:focus:border-blue-600 transition-colors"
              />

              {!searchQuery && (
                <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                  <TabsList className="w-full flex-wrap h-auto bg-blue-100 dark:bg-gray-800">
                    {Object.keys(STICKER_CATEGORIES).map((category) => (
                      <TabsTrigger
                        key={category}
                        value={category}
                        className="flex-1 min-w-[100px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white transition-all"
                      >
                        {category}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              )}

              <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-2 sm:gap-3 max-h-[450px] overflow-y-auto p-2 sm:p-3 rounded-lg bg-white/50 dark:bg-gray-900/50">
                {filteredStickers.map((sticker, index) => (
                  <motion.div
                    key={`${sticker.emoji}-${index}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.01, duration: 0.2 }}
                    whileHover={{ scale: 1.2, rotate: [0, -5, 5, 0] }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Button
                      variant="ghost"
                      className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 text-2xl sm:text-3xl md:text-4xl hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-xl sm:rounded-2xl transition-all shadow-sm hover:shadow-lg p-0"
                      onClick={() => handleSelectSticker(sticker.emoji)}
                    >
                      {sticker.emoji}
                    </Button>
                  </motion.div>
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {creatingPack ? (
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-3">
                  <h3 className="font-bold dark:text-white">Create New Pack</h3>
                  <Input
                    placeholder="my-stickers"
                    value={newPackName}
                    onChange={(e) => setNewPackName(e.target.value)}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Use lowercase letters, numbers, and hyphens only
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setCreatingPack(false);
                        setNewPackName('');
                      }}
                      className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white"
                    >
                      {t('common.cancel')}
                    </Button>
                    <Button
                      onClick={() => {
                        const sanitized = newPackName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
                        if (!sanitized) {
                          alert(t('sticker.enterPackName'));
                          return;
                        }
                        onClose();
                        navigate(`/stickers/${sanitized}/manage`);
                      }}
                      disabled={!newPackName.trim()}
                      className="flex-1 bg-green-600 text-white"
                    >
                      {t('sticker.create')}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => setCreatingPack(true)}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-blue-500 text-white"
                >
                  <Plus className="size-4" />
                  Create New Sticker Pack
                </Button>
              )}

              <div className="max-h-[450px] overflow-y-auto space-y-4 p-2">
                {Object.keys(stickerPacks).length === 0 ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    No custom sticker packs yet. Create one to get started!
                  </div>
                ) : (
                  Object.entries(stickerPacks).map(([packName, pack]) => (
                    <div key={packName} className="bg-white dark:bg-gray-800 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-lg dark:text-white">{pack.name}</h3>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            onClose();
                            navigate(`/stickers/${packName}`);
                          }}
                        >
                          {t('sticker.viewPack')}
                        </Button>
                      </div>
                      <div className="grid grid-cols-6 gap-2">
                        {pack.stickers.map((sticker) => (
                          <motion.button
                            key={sticker.id}
                            onClick={() => handleSelectSticker(sticker.imageUrl)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500"
                          >
                            <img
                              src={sticker.imageUrl}
                              alt="Sticker"
                              className="w-full h-full object-cover"
                            />
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}