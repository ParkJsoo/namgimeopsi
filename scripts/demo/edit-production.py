#!/usr/bin/env python3
"""Create a separate P3 edit from the 2026-09-14 take; never overwrite the source."""
from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
import argparse,re,json,subprocess
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--output-dir',type=Path,default=Path('.expo/demo-production/p3-edit'))
args=parser.parse_args()
source=Path('.expo/demo-production/final')
start=json.loads((source/'take2-time.json').read_text())['started']
marks={n:float(t)-start for n,t in re.findall(r'REHEARSAL (\S+) ([0-9.]+)',(source/'take2.log').read_text())}
p=args.output_dir
p.mkdir(parents=True,exist_ok=False)
scenes=[
 ('00-intro','01-receipt-start',8,'남김없이','초안부터 실제 소비까지\n사용자의 확인으로 연결합니다.','01  영수증 검수    02  남은 음식    03  남은 양 기록'),
 ('01-receipt-start','03-review',12,'영수증으로 시작','사진은 비공개로 보관합니다.\n현재 분석 결과는 고정 샘플입니다.','실제 OCR 정확도를 시연하는 영상이 아닙니다.'),
 ('03-review','04-oil',10,'AI는 초안만 제시','원문과 확인 필요 표시를 보고\n저장할 내용을 직접 검수합니다.','확정 전에는 재고에 반영하지 않습니다.'),
 ('04-oil','06-before-intake',16,'고치거나 제외하기','참기름은 “조금 남음”으로 수정하고\n돼지고기는 입고에서 제외합니다.','생활 단위를 그대로 기록합니다.'),
 ('06-before-intake','09-leftover',10,'확정한 다섯 품목만','사용자가 누른 확정이\n재고와 입고 원장의 경계입니다.','빈 재고 → 5개 입고'),
 ('09-leftover','11-recommendation',16,'남은 음식도 간단하게','남은 카레 · 냉장 · 1인분\n권장일과 보관 시작을 구분합니다.','권장 섭취일은 식품 안전을 보장하지 않습니다.'),
 ('11-recommendation','12-cooking',14,'이유를 보고 메뉴 선택','기준 날짜가 지난 재료는\n사용 전 상태 확인을 안내합니다.','최대 3개 · 부족 재료 · 조리 시간 · 결정론적 추천'),
 ('12-cooking','13-cooking-before-confirm',16,'실제로 남은 양을 확인','두부는 “반 모”를 남기고\n애호박은 “다 먹음”으로 기록합니다.','자동 수량 환산 없이 사용자가 확인합니다.'),
 ('13-cooking-before-confirm','14-final-inventory',8,'확정 후 재고에 반영','부분 소비는 남은 수량을 유지하고\n전량 소비는 활성 목록에서 제외합니다.','두부 1모 → 반 모   /   애호박 1개 → 전량 소비'),
 ('14-final-inventory','15-end',10,'사용자의 확인으로 끝까지','영수증 검수 → 메뉴 결정 → 남은 양 기록','iOS 시뮬레이터 · OCR fixture · 실제 앱 동작'),
]
fontpath='/System/Library/Fonts/AppleSDGothicNeo.ttc'
def font(size):return ImageFont.truetype(fontpath,size)
segments=[];timeline=[];offset=0
for idx,(a,b,duration,title,body,note) in enumerate(scenes):
 im=Image.new('RGB',(1920,1080),'#F8F7F3');d=ImageDraw.Draw(im)
 d.rounded_rectangle((76,36,564,1044),radius=48,fill='#E9ECE6')
 d.text((664,90),'NAMGIMEOPSI  /  남김없이',font=font(28),fill='#2F6B4F')
 d.text((664,190),'iOS 시뮬레이터  ·  OCR fixture',font=font(30),fill='#6C7168')
 d.text((664,300),title,font=font(62),fill='#20271F')
 d.line((664,400,1744,400),fill='#C6D4C8',width=3)
 d.multiline_text((664,455),body,font=font(42),fill='#303C32',spacing=24)
 d.rounded_rectangle((644,710,1840,830),radius=20,fill='#E4F0E7')
 d.text((674,750),note,font=font(30),fill='#2F6B4F')
 d.text((664,960),'입력·스크롤·대기 구간 축약  |  무음·한국어 자막',font=font(26),fill='#6C7168')
 d.text((1730,1000),f'{idx+1:02d} / 10',font=font(24),fill='#6C7168')
 card=p/f'card-{idx:02}.png';im.save(card)
 # Keep the saved leftover inventory visible until its explanation ends.
 # The final 0.5s of this source scene begins the navigation back to Home.
 ends = {'00-intro': marks[a]+2.7, '06-before-intake': marks['07-intake-complete']+1.8, '09-leftover': marks['11-recommendation']-.5, '11-recommendation': marks[a]+3.8}
 length=ends.get(a,marks[b])-marks[a];speed=min(1,(duration-.2)/length)
 out=p/f'segment-{idx:02}.mp4'
 cmd=['ffmpeg','-n','-v','error','-ss',str(marks[a]),'-t',str(length),'-i',str(source/'take2-cfr.mp4'),'-loop','1','-i',str(card),'-filter_complex',f'[0:v]setpts={speed}*(PTS-STARTPTS),fps=30,scale=444:960,tpad=stop_mode=clone:stop_duration={duration}[phone];[1:v][phone]overlay=98:60:shortest=1,format=yuv420p[out]','-map','[out]','-t',str(duration),'-r','30','-c:v','libx264','-preset','fast','-crf','19','-an',str(out)]
 subprocess.run(cmd,check=True);segments.append(out.name);timeline.append({'start':offset,'duration':duration,'title':title,'body':body,'sourceStart':marks[a],'sourceEnd':marks[a]+length});offset+=duration
(p/'segments.txt').write_text(''.join(f"file '{s}'\n" for s in segments))
subprocess.run(['ffmpeg','-n','-v','error','-f','concat','-safe','0','-i',str(p/'segments.txt'),'-c','copy','-movflags','+faststart',str(p/'namgimeopsi-demo-ko.mp4')],check=True)
(p/'timeline.json').write_text(json.dumps(timeline,ensure_ascii=False,indent=2))
print('Created 120-second edit',flush=True)
