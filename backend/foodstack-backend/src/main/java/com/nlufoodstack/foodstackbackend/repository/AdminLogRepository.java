package com.nlufoodstack.foodstackbackend.repository;

import com.nlufoodstack.foodstackbackend.entity.AdminLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AdminLogRepository extends JpaRepository<AdminLog, Long> {

    @Query("""
        SELECT l
        FROM AdminLog l
        LEFT JOIN FETCH l.admin
        WHERE (:action IS NULL OR :action = '' OR l.action = :action)
          AND (:target IS NULL OR :target = '' OR l.target = :target)
        ORDER BY l.createdAt DESC
    """)
    List<AdminLog> searchLogs(
            @Param("action") String action,
            @Param("target") String target
    );
}