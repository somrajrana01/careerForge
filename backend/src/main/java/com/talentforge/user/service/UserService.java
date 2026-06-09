package com.talentforge.user.service;

import com.talentforge.common.exception.ResourceNotFoundException;
import com.talentforge.user.dto.UserResponse;
import com.talentforge.user.entity.AppUser;
import com.talentforge.user.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public AppUser findByEmailOrThrow(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    public AppUser getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new ResourceNotFoundException("Authenticated user not found");
        }
        return findByEmailOrThrow(authentication.getName());
    }

    public UserResponse getCurrentUserResponse() {
        return UserResponse.from(getCurrentUser());
    }
}
