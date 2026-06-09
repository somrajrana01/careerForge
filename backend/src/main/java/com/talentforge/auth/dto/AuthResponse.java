package com.talentforge.auth.dto;

import com.talentforge.user.dto.UserResponse;

public record AuthResponse(
        String token,
        String tokenType,
        UserResponse user
) {
}
