# J.A.R.V.I.S. Ultra-Realistic Neural Speech Engine
import sys
import asyncio
import argparse
import edge_tts

VOICE_MAP = {
    'jarvis': 'en-GB-RyanNeural',
    'en-GB': 'en-GB-RyanNeural',
    'friday': 'en-IE-EmilyNeural',
    'en-IE': 'en-IE-EmilyNeural',
    'ultron': 'en-GB-ThomasNeural',
    'aegis': 'en-US-ChristopherNeural',
    'en-US': 'en-US-ChristopherNeural',
    'vortex': 'en-AU-WilliamNeural',
    'en-AU': 'en-AU-WilliamNeural',
    'midas': 'en-IN-PrabhatNeural',
    'en-IN': 'en-IN-PrabhatNeural',
    'cerebro': 'en-CA-LiamNeural',
    'en-CA': 'en-CA-LiamNeural',
    'stark_os': 'en-GB-ThomasNeural',
    'daedalus': 'en-GB-RyanNeural',
    'sentinel': 'en-US-ChristopherNeural',
    'cerberus': 'en-US-EricNeural',
    'oracle': 'en-IN-PrabhatNeural',
    'atlas': 'en-AU-WilliamNeural',
    'deepseek': 'en-US-EricNeural',
    'autogen': 'en-GB-RyanNeural',
    'crewai': 'en-US-RogerNeural',
    'browser_use': 'en-IE-ConnorNeural',
    'metagpt': 'en-US-GuyNeural',
    'foundry': 'en-US-SteffanNeural',
    'openhands': 'en-NZ-MitchellNeural',
    'smolagent': 'en-SG-WayneNeural',
    'camel': 'en-ZA-LukeNeural',
    'langgraph': 'en-US-AndrewNeural'
}

async def synthesize(text, voice_key, out_path=None):
    voice = VOICE_MAP.get(voice_key, voice_key if 'Neural' in voice_key else 'en-GB-RyanNeural')
    # Filter markdown/code
    clean = text.replace('`', '').replace('*', '').replace('#', '').strip()
    if not clean:
        clean = 'Understood, Master Sri.'
    
    communicate = edge_tts.Communicate(clean, voice)
    if out_path:
        await communicate.save(out_path)
    else:
        chunks = []
        async for chunk in communicate.stream():
            if chunk['type'] == 'audio':
                chunks.append(chunk['data'])
        audio = b''.join(chunks)
        sys.stdout.buffer.write(audio)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--text', required=True)
    parser.add_argument('--voice', default='jarvis')
    parser.add_argument('--out', default=None)
    args = parser.parse_args()
    
    asyncio.run(synthesize(args.text, args.voice, args.out))
