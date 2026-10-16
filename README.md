# 인스타그램, 스레드 게시 자동화 스크립트

Node.js 18 이상만 있으면 됩니다(추가 패키지 없음). 메타 공식 API만 씁니다.

| 파일 | 하는 일 |
|---|---|
| `post-reel.mjs` | 릴스 1편 게시 (영상 파일 직접 업로드) |
| `post-carousel.mjs` | 캐러셀 2~10장 게시 (cloudflared 필요) |
| `threads-post.mjs` | 스레드 글 1개 게시 |
| `comment-dm.mjs` | 댓글에 키워드 남긴 사람에게 자료 DM |
| `insights.mjs` | 최근 게시물 성과 표 |
| `token-refresh.mjs` | 토큰을 만료 없는 페이지 토큰으로 바꿈 |

모든 게시 스크립트는 **기본이 점검만**이고, 끝에 `--go`를 붙여야 실제로 올라갑니다.

## 준비 (한 번만)

1. 인스타그램을 **프로페셔널 계정**으로 바꾸고 **페이스북 페이지에 연결**
2. developers.facebook.com 에서 앱 만들기 → 인스타그램 Graph API 추가
3. `.env.example`을 `.env`로 복사하고 앱 ID, 시크릿, 페이지 ID, 인스타 사용자 ID 채우기
4. Graph API 탐색기에서 아래 권한으로 토큰 만들기 → `.env`의 `IG_TOKEN=`에 붙여넣기 → `node token-refresh.mjs`
   - instagram_basic, instagram_content_publish, instagram_manage_comments, instagram_manage_messages, instagram_manage_insights, pages_show_list, pages_read_engagement
5. 스레드는 Threads API 앱에서 토큰과 사용자 ID를 받아 `THREADS_TOKEN`, `THREADS_USER_ID`에

## 쓰는 법

```
node post-reel.mjs --file 영상.mp4 --caption 캡션.txt          # 점검
node post-reel.mjs --file 영상.mp4 --caption 캡션.txt --go     # 게시
node post-carousel.mjs --dir 카드폴더 --caption 캡션.txt --go
node threads-post.mjs --text 글.txt --go
node comment-dm.mjs --go          # dm.json.example 을 dm.json 으로 복사해 채운 뒤
node insights.mjs 30
```

정해진 시간에 돌리려면 윈도우 작업 스케줄러나 맥 cron에 위 명령을 등록하세요.

## 주의

- `.env`(토큰)는 절대 공유하거나 깃허브에 올리지 마세요. `.gitignore`에 넣어 두었습니다
- 댓글 DM은 인스타 정책상 **댓글 후 7일 안**에만 보낼 수 있고, 한 댓글에 한 번만 보냅니다
- 자동 좋아요, 자동 팔로우, 대량 DM은 인스타 약관 위반이라 넣지 않았습니다
- 게시 한도는 하루 API 게시 수 제한이 있습니다(공식 문서 확인)
- MIT 라이선스, 스탠리탬(@stanleetamaiworklab)
