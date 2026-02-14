# TMDB API로 얻을 수 있는 내용 정리

Arcane Archive에서 사용하는 TMDB API 응답 구조와 필드 정리.  
(검색·상세 조회 시 참고용)

---

## 1. 현재 사용 중인 API

### 검색 (Multi Search)

- **엔드포인트**: `GET https://api.themoviedb.org/3/search/multi`
- **우리 프록시**: `GET /api/tmdb/search?q=검색어&page=1`
- **용도**: 영화·TV(애니)·인물을 한 번에 검색

**주요 쿼리 파라미터**

| 파라미터 | 설명 | 예시 |
|----------|------|------|
| `api_key` | TMDB API 키 | (서버 .env에서 주입) |
| `query` | 검색어 | `프리렌` |
| `language` | 응답 언어 | `ko-KR` |
| `page` | 페이지 (1부터) | `1` |
| `include_adult` | 성인 포함 여부 | `false` |

---

## 2. 검색 결과 (Multi Search) 응답 구조

### 최상위

| 필드 | 타입 | 설명 |
|------|------|------|
| `page` | number | 현재 페이지 |
| `results` | array | 검색 결과 배열 (아래 항목 구조) |
| `total_pages` | number | 전체 페이지 수 |
| `total_results` | number | 전체 결과 수 |

### results[] 항목 (공통)

모든 `media_type`에서 공통으로 올 수 있는 필드:

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | number | TMDB 내부 ID (media_type 안에서만 유일) |
| `media_type` | string | `"movie"` \| `"tv"` \| `"person"` |
| `overview` | string | 줄거리/소개 (없을 수 있음) |
| `poster_path` | string \| null | 포스터 이미지 경로 (앞에 base URL 붙여 사용) |
| `backdrop_path` | string \| null | 배경 이미지 경로 |
| `genre_ids` | number[] | 장르 ID 배열 |
| `original_language` | string | 원어 코드 (예: `ja`, `en`) |
| `original_title` | string | 원제 (영화) |
| `popularity` | number | 인기도 점수 |
| `vote_average` | number | 평균 평점 (0~10) |
| `vote_count` | number | 평점 참여 수 |
| `adult` | boolean | 성인 여부 |

### media_type별 차이

| 필드 | movie | tv | person |
|------|-------|-----|--------|
| **제목** | `title` | `name` | `name` |
| **날짜** | `release_date` (개봉일) | `first_air_date` (첫 방영일) | — |
| **기타** | `video` (boolean) | `origin_country` 등 | `known_for_department`, `known_for` 등 |

영상(영화/TV)만 쓸 때는 `title || name`, `release_date || first_air_date` 로 통일해서 쓰면 됨.

---

## 3. 이미지 URL 만들기

`poster_path`, `backdrop_path`는 앞에 base URL을 붙여야 함.

- **형식**: `https://image.tmdb.org/t/p/{size}{file_path}`
- **size 예시**: `w500`, `w780`, `original` 등
- **예**: `poster_path`가 `/abc123.jpg` 이면  
  `https://image.tmdb.org/t/p/w500/abc123.jpg`

우리 테스트 페이지에서는 `w500` 사용 중.

---

## 4. 영상 고유 키 (우리 서비스용)

TMDB에서 **영상 하나**를 고유하게 구분하려면 `id`만 쓰면 안 되고, **`media_type`과 `id`를 함께** 써야 함. (영화 id=11과 TV id=11은 다른 작품.)

- **복합 키**: `(media_type, id)`  
  예: `media_type: "tv", id: 93405`
- **문자열 키**: `media_type + ":" + id`  
  예: `"tv:93405"`, `"movie:11"`  
  → DB 컬럼(`tmdb_key`)이나 URL에 사용하기 좋음.

---

## 5. 상세 조회 (필요 시 추가 연동)

질문 생성 등에서 **줄거리·장르명·러닝타임** 등 더 많은 메타가 필요하면 아래 상세 API 사용 가능.

### 영화 상세

- **엔드포인트**: `GET https://api.themoviedb.org/3/movie/{movie_id}`
- **추가로 얻을 수 있는 것**:  
  `overview`, `tagline`, `genres`(id+name), `runtime`, `release_date`, `status`, `imdb_id` 등

### TV 시리즈 상세

- **엔드포인트**: `GET https://api.themoviedb.org/3/tv/{tv_id}`
- **추가로 얻을 수 있는 것**:  
  `overview`, `name`, `first_air_date`, `genres`, `number_of_seasons`, `number_of_episodes`, `status` 등

둘 다 쿼리 파라미터 `language=ko-KR` 로 한글 메타 받을 수 있음.

---

## 6. OpenAI 질문 생성에 넣기 좋은 필드

검색 결과만 쓸 때:

- **필수**: `id`, `media_type`, 제목(`title` 또는 `name`)
- **권장**: `overview`, `release_date` 또는 `first_air_date`, `genre_ids` (또는 상세 조회 후 `genres[].name`)

상세 조회까지 쓰면:

- `overview` (줄거리)
- `genres[].name` (장르명)
- `tagline` (영화 한줄 소개)
- `runtime` / `number_of_episodes` (분량)

이 조합으로 프롬프트에 넣으면 “이 작품에 대한 질문 1개 생성”에 충분함.
