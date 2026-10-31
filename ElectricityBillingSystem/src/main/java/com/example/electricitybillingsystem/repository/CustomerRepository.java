package com.example.electricitybillingsystem.repository;

import com.example.electricitybillingsystem.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerRepository extends JpaRepository<Customer, Integer> {
}
