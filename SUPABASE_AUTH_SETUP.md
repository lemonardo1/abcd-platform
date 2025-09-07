# Supabase 인증 설정 가이드

이 파일은 팀 빌더 앱에서 Supabase Auth를 설정하기 위해 Supabase 대시보드에서 해야 할 작업들을 안내합니다.

## 1. Supabase 프로젝트 생성 (이미 완료했다면 건너뛰기)

1. [Supabase](https://supabase.com)에 로그인
2. "New Project" 클릭
3. 프로젝트 이름, 데이터베이스 비밀번호 설정
4. 프로젝트 생성 완료까지 대기 (2-3분)

## 2. Authentication 설정

### 2.1 인증 제공자 설정
1. Supabase 대시보드에서 **Authentication** > **Providers** 이동
2. **Email** 제공자가 기본적으로 활성화되어 있는지 확인
3. 필요시 다른 제공자(Google, GitHub 등)도 활성화 가능

### 2.2 이메일 템플릿 설정 (선택사항)
1. **Authentication** > **Templates** 이동
2. 회원가입 확인 이메일, 비밀번호 재설정 이메일 템플릿 커스터마이징 가능

### 2.3 URL 설정
1. **Authentication** > **URL Configuration** 이동
2. **Site URL**: `http://localhost:3000` (개발용)
3. **Redirect URLs**에 다음 추가:
   - `http://localhost:3000`
   - `http://localhost:3000/auth/callback`
   - 나중에 배포할 도메인도 추가 (예: `https://your-domain.com`)

## 3. 데이터베이스 스키마 실행

1. **SQL Editor** 이동
2. `supabase-schema.sql` 파일의 내용을 복사해서 실행
3. 테이블 생성 확인: `ideas`, `teams`, `team_members`

## 4. Row Level Security (RLS) 정책 확인

스키마 실행 후 다음 정책들이 제대로 생성되었는지 확인:

### Ideas 테이블 정책:
- ✅ "Anyone can view ideas" - 모든 사용자가 아이디어 조회 가능
- ✅ "Users can insert their own ideas" - 사용자가 자신의 아이디어만 생성 가능
- ✅ "Users can update their own ideas" - 사용자가 자신의 아이디어만 수정 가능

### Teams 테이블 정책:
- ✅ "Anyone can view teams" - 모든 사용자가 팀 조회 가능
- ✅ "Users can insert their own teams" - 사용자가 자신의 팀만 생성 가능
- ✅ "Team leaders can update their teams" - 팀장이 자신의 팀만 수정 가능

### Team Members 테이블 정책:
- ✅ "Anyone can view team members" - 모든 사용자가 팀 멤버 조회 가능
- ✅ "Users can insert themselves as team members" - 사용자가 자신을 팀 멤버로만 추가 가능
- ✅ "Users can update their own membership" - 사용자가 자신의 멤버십만 수정 가능

## 5. API 키 확인

1. **Settings** > **API** 이동
2. 다음 정보를 `.env.local` 파일에 복사:
   - **Project URL**: `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 6. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일 생성:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## 7. 테스트 계정 생성 (선택사항)

1. **Authentication** > **Users** 이동
2. "Add user" 버튼으로 테스트 계정 생성
3. 또는 앱에서 회원가입 기능으로 테스트

## ✅ 완료 체크리스트

- [ ] Supabase 프로젝트 생성
- [ ] Authentication Providers 설정 (Email 활성화)
- [ ] URL Configuration 설정 (Site URL, Redirect URLs)
- [ ] 데이터베이스 스키마 실행 (`supabase-schema.sql`)
- [ ] RLS 정책 확인
- [ ] API 키를 `.env.local`에 설정
- [ ] 테스트 계정 생성 (선택사항)

## 다음 단계

위의 모든 설정이 완료되면, 개발자에게 알려주세요. 
로그인/회원가입 UI와 인증 로직을 구현하겠습니다.

## 문제 해결

### 일반적인 문제들:

1. **"Invalid login credentials" 오류**
   - 이메일/비밀번호 확인
   - 이메일 확인이 필요한지 확인

2. **"Email not confirmed" 오류**
   - 회원가입 후 이메일 확인 링크 클릭 필요
   - 또는 Authentication > Users에서 수동으로 이메일 확인 처리

3. **"Site URL not allowed" 오류**
   - URL Configuration에서 현재 도메인이 허용되었는지 확인

4. **RLS 정책 오류**
   - SQL Editor에서 정책이 제대로 생성되었는지 확인
   - 필요시 정책을 다시 실행

문제가 있으면 언제든 알려주세요!
