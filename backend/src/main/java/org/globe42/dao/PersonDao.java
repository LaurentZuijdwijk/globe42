package org.globe42.dao;

import java.util.Optional;

import org.globe42.domain.Person;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * DAO for the {@link org.globe42.domain.Person} entity
 * @author JB Nizet
 */
public interface PersonDao extends JpaRepository<Person, Long> {
    boolean existsByNickName(String surName);
    Optional<Person> findByNickName(String surName);
}
