package com.nlufoodstack.foodstackbackend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FacebookLoginRequest {

    @NotBlank(message = "Facebook access token không được để trống")
    private String accessToken;
}