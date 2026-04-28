package com.reliefconnection.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.reliefconnection.entity.ReliefRecord;

public interface ReliefRecordRepository extends JpaRepository<ReliefRecord, String> {
    @Query("select r from ReliefRecord r where r.userEmail = :userEmail or r.type in :publicTypes")
    List<ReliefRecord> findVisibleForUser(
            @Param("userEmail") String userEmail,
            @Param("publicTypes") Collection<String> publicTypes);
}
