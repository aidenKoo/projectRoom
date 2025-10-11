# Security Enhancements

## Overview

프로젝트에 다층 보안 시스템이 구현되었습니다:
1. **Row Level Security (RLS)** - 데이터베이스 레벨 보안
2. **Role-Based Access Control (RBAC)** - 역할 기반 접근 제어
3. **Permission-Based Authorization** - 세분화된 권한 시스템
4. **Audit Logging** - 모든 민감한 작업 로깅

---

## 1. Row Level Security (RLS)

### 적용된 테이블
- ✅ profiles
- ✅ user_verifications
- ✅ photos
- ✅ preferences
- ✅ embeddings
- ✅ swipes
- ✅ matches
- ✅ conversations
- ✅ messages
- ✅ reports
- ✅ blocks

### RLS 정책 예시

**자신의 프로필만 수정 가능:**
```sql
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (owns_profile(user_id))
  WITH CHECK (owns_profile(user_id));
```

**매칭된 사용자의 메시지만 읽기 가능:**
```sql
CREATE POLICY "Users can read own messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
        AND (conversations.user_a_id = auth.uid()
          OR conversations.user_b_id = auth.uid())
    )
  );
```

### Helper Functions

```sql
-- 관리자 권한 확인
is_admin() -> BOOLEAN

-- 모더레이터 또는 관리자 권한 확인
is_moderator_or_admin() -> BOOLEAN

-- 프로필 소유권 확인
owns_profile(profile_user_id UUID) -> BOOLEAN

-- 매칭 여부 확인
are_matched(user1_id UUID, user2_id UUID) -> BOOLEAN

-- 차단 여부 확인
is_blocked_by(blocker_id UUID, blocked_id UUID) -> BOOLEAN
```

### 마이그레이션 적용

```bash
# Local
supabase migration up

# Production
supabase db push
```

---

## 2. Role-Based Access Control (RBAC)

### 사용자 역할

```typescript
enum UserRole {
  USER = 'user',           // 일반 사용자
  MODERATOR = 'moderator', // 콘텐츠 모더레이터
  ADMIN = 'admin',         // 시스템 관리자
  SERVICE = 'service',     // 백엔드 서비스 계정
}
```

### 역할 할당

**Supabase Auth:**
```typescript
// User metadata에 역할 저장
await supabase.auth.admin.updateUserById(userId, {
  user_metadata: {
    role: 'moderator'
  }
})
```

**Backend에서 확인:**
```typescript
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles('admin', 'moderator')
async moderateContent() {
  // Only admins and moderators can access
}
```

---

## 3. Permission-Based Authorization

### 권한 목록

**사용자 관리:**
- `read:own_profile` - 자신의 프로필 읽기
- `update:own_profile` - 자신의 프로필 수정
- `read:any_profile` - 모든 프로필 읽기
- `update:any_profile` - 모든 프로필 수정
- `delete:any_profile` - 프로필 삭제

**사진 관리:**
- `upload:photo` - 사진 업로드
- `delete:own_photo` - 자신의 사진 삭제
- `delete:any_photo` - 모든 사진 삭제
- `moderate:photo` - 사진 검수

**매칭 & 상호작용:**
- `swipe` - 좋아요/패스
- `send:message` - 메시지 전송
- `read:own_messages` - 자신의 메시지 읽기
- `read:any_messages` - 모든 메시지 읽기

**모더레이션:**
- `read:reports` - 신고 내역 조회
- `resolve:reports` - 신고 처리
- `ban:user` - 사용자 정지
- `unban:user` - 정지 해제

**분석 & 감사:**
- `read:analytics` - 통계 조회
- `read:audit_logs` - 감사 로그 조회
- `export:data` - 데이터 내보내기

**시스템 관리:**
- `manage:roles` - 역할 관리
- `manage:settings` - 설정 관리
- `manage:codes` - 초대 코드 관리

### 권한 사용 예시

```typescript
import { RequirePermissions } from '@/common/guards/permissions.guard';
import { Permission } from '@/common/enums/permissions.enum';

@Controller('photos')
export class PhotosController {

  @Post()
  @RequirePermissions([Permission.UPLOAD_PHOTO])
  async uploadPhoto() {
    // Only users with UPLOAD_PHOTO permission
  }

  @Delete(':id')
  @RequirePermissions([
    Permission.DELETE_OWN_PHOTO,
    Permission.DELETE_ANY_PHOTO
  ], false) // false = ANY permission (OR logic)
  async deletePhoto(@Param('id') id: string) {
    // Users with either permission can access
  }

  @Post(':id/moderate')
  @RequirePermissions([Permission.MODERATE_PHOTO])
  async moderatePhoto(@Param('id') id: string) {
    // Only moderators and admins
  }
}
```

### 역할별 권한 매핑

```typescript
ROLE_PERMISSIONS = {
  user: [
    'read:own_profile',
    'update:own_profile',
    'upload:photo',
    'swipe',
    'send:message',
    // ...
  ],

  moderator: [
    // All user permissions +
    'read:any_profile',
    'moderate:photo',
    'read:reports',
    'resolve:reports',
    'ban:user',
    // ...
  ],

  admin: [
    // All moderator permissions +
    'delete:any_profile',
    'unban:user',
    'manage:roles',
    'manage:settings',
    // ...
  ]
}
```

---

## 4. Audit Logging

### 자동 로깅 대상

모든 민감한 작업이 자동으로 로깅됩니다:

- 프로필 수정
- 사진 업로드/삭제
- 사용자 정지/해제
- 권한 변경
- 신고 처리
- 모더레이션 작업

### Audit Log 구조

```typescript
interface AuditLog {
  id: number;
  action: AuditAction; // 'PROFILE_UPDATE', 'USER_BAN', etc.
  accessorId: string;  // 작업 수행자
  targetUserId: string; // 대상 사용자
  timestamp: Date;
  details?: {
    ip?: string;
    requestId?: string;
    reason?: string;
    changes?: Record<string, any>;
  };
}
```

### API 엔드포인트

**감사 로그 조회 (Moderator+):**
```bash
GET /v1/audit-logs?page=1&limit=50
GET /v1/audit-logs?action=USER_BAN&targetUid=xxx
GET /v1/audit-logs/user/:uid
GET /v1/audit-logs/actor/:uid
GET /v1/audit-logs/stats?startDate=2025-01-01&endDate=2025-01-31
```

**응답 예시:**
```json
{
  "items": [
    {
      "id": 123,
      "action": "USER_BAN",
      "accessorId": "moderator-uid-123",
      "targetUserId": "user-uid-456",
      "timestamp": "2025-01-11T10:30:00Z",
      "details": {
        "reason": "Inappropriate content",
        "duration": "7d",
        "ip": "192.168.1.1"
      }
    }
  ],
  "meta": {
    "totalItems": 1234,
    "currentPage": 1,
    "totalPages": 25,
    "hasNextPage": true
  }
}
```

**통계 조회:**
```json
{
  "range": {
    "start": "2025-01-01T00:00:00Z",
    "end": "2025-01-31T23:59:59Z"
  },
  "totals": {
    "USER_BAN": 45,
    "PROFILE_UPDATE": 1230,
    "PHOTO_DELETE": 89
  },
  "totalEvents": 1364,
  "daily": [
    {
      "date": "2025-01-01",
      "counts": {
        "USER_BAN": 2,
        "PROFILE_UPDATE": 45
      }
    }
  ]
}
```

---

## 5. Security Best Practices

### Backend

**1. 항상 Guards 사용:**
```typescript
@UseGuards(FirebaseAuthGuard, PermissionsGuard)
@RequirePermissions([Permission.MODERATE_PHOTO])
```

**2. 입력 검증:**
```typescript
@IsString()
@MaxLength(500)
@IsOptional()
reason?: string;
```

**3. Audit Logging:**
```typescript
await this.auditLogsService.createLog({
  accessorId: moderatorId,
  targetUserId: userId,
  action: 'USER_BAN',
  reason: banDto.reason,
  ip: request.ip
});
```

### Frontend

**1. 권한 기반 UI:**
```typescript
{user.hasPermission('moderate:photo') && (
  <Button onClick={handleModerate}>
    Moderate Photo
  </Button>
)}
```

**2. 토큰 관리:**
```typescript
// Always use httpOnly cookies or secure storage
// NEVER store JWT in localStorage
```

**3. Rate Limiting:**
```typescript
// Implement client-side rate limiting for sensitive actions
const lastAction = localStorage.getItem('lastBanAction');
if (Date.now() - lastAction < 60000) {
  throw new Error('Please wait before performing this action again');
}
```

### Database

**1. RLS 항상 활성화:**
```sql
ALTER TABLE sensitive_table ENABLE ROW LEVEL SECURITY;
```

**2. 최소 권한 원칙:**
```sql
-- Only grant necessary permissions
GRANT SELECT ON profiles TO authenticated;
-- No UPDATE/DELETE for regular users
```

**3. 인덱스 최적화:**
```sql
-- RLS 쿼리 성능 향상
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_blocks_blocker_blocked ON blocks(blocker_user_id, blocked_user_id);
```

---

## 6. Testing Security

### RLS 정책 테스트

```typescript
// Test as regular user
const { data, error } = await supabase
  .auth.setSession(userSession)
  .from('profiles')
  .select('*')
  .eq('user_id', otherUserId);

// Should return data only if not blocked
expect(error).toBeNull();
expect(data).toBeDefined();

// Test as admin
const { data: adminData } = await supabase
  .auth.setSession(adminSession)
  .from('profiles')
  .select('*');

// Admin should see all profiles
expect(adminData.length).toBeGreaterThan(1);
```

### Permission Guard 테스트

```typescript
describe('PhotosController', () => {
  it('should allow moderators to delete any photo', async () => {
    const moderator = { role: 'moderator', uid: 'mod-123' };

    const result = await controller.deletePhoto('photo-id', moderator);

    expect(result.success).toBe(true);
  });

  it('should deny regular users from deleting others photos', async () => {
    const user = { role: 'user', uid: 'user-123' };

    await expect(
      controller.deletePhoto('other-photo-id', user)
    ).rejects.toThrow(ForbiddenException);
  });
});
```

---

## 7. Monitoring & Alerts

### 로그 모니터링

```bash
# Real-time audit log monitoring
supabase functions logs audit-logs --follow

# Check for suspicious activity
SELECT
  action,
  accessor_id,
  COUNT(*) as count
FROM audit_logs
WHERE timestamp > NOW() - INTERVAL '1 hour'
GROUP BY action, accessor_id
HAVING COUNT(*) > 100; -- Rate limit threshold
```

### 알림 설정

**의심스러운 활동 감지:**
- 1시간 내 100회 이상 동일 작업
- 비정상적인 시간대 관리자 작업
- 대량 사용자 정지
- 권한 변경

**Slack/Email 알림 예시:**
```typescript
if (suspiciousActivity) {
  await notificationService.alert({
    type: 'SECURITY_ALERT',
    severity: 'HIGH',
    message: `User ${userId} performed ${action} ${count} times in 1 hour`,
    metadata: { userId, action, count }
  });
}
```

---

## 8. Compliance

### GDPR

- ✅ 사용자 데이터 내보내기 (export:data 권한)
- ✅ 계정 삭제 시 연관 데이터 CASCADE 삭제
- ✅ 데이터 접근 로깅 (감사 로그)
- ✅ RLS로 데이터 격리

### Data Retention

```sql
-- 90일 이상 경과한 감사 로그 삭제
DELETE FROM audit_logs
WHERE timestamp < NOW() - INTERVAL '90 days';

-- 탈퇴 후 30일 경과 데이터 삭제
DELETE FROM deleted_users
WHERE deleted_at < NOW() - INTERVAL '30 days';
```

---

## 9. Troubleshooting

### RLS 정책 디버깅

```sql
-- RLS 정책 확인
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- 특정 사용자로 테스트
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims.sub = 'user-uid-123';
SELECT * FROM profiles WHERE user_id = 'other-uid-456';
```

### 권한 문제

```typescript
// 사용자의 권한 확인
import { getRolePermissions } from '@/common/enums/permissions.enum';

const userPermissions = getRolePermissions(user.role);
console.log('User has permissions:', userPermissions);

// 특정 권한 확인
if (hasPermission(user.role, Permission.MODERATE_PHOTO)) {
  // Allow moderation
}
```

---

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [NestJS Guards](https://docs.nestjs.com/guards)
- [OWASP Security Guidelines](https://owasp.org/www-project-top-ten/)
