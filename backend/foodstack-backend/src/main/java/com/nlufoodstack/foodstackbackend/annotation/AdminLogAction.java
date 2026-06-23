package com.nlufoodstack.foodstackbackend.annotation;

import java.lang.annotation.*;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface AdminLogAction {
    String action();
    String target();
}