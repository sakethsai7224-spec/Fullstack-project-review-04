package com.reliefconnection.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.reliefconnection.entity.AppUser;

public interface UserRepository extends JpaRepository<AppUser, Long> {
    Optional<AppUser> findByEmail(String email);

    Optional<AppUser> findByEmailAndPassword(String email, String password);

    boolean existsByEmail(String email);
}
