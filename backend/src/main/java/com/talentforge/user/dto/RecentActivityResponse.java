package com.talentforge.user.dto;

import java.time.LocalDateTime;

public record RecentActivityResponse(
        String type,
        String description,
        LocalDateTime occurredAt
) {
}
