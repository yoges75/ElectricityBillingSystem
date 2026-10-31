package com.example.electricitybillingsystem.service;

import com.example.electricitybillingsystem.model.Customer;
import com.example.electricitybillingsystem.repository.CustomerRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class CustomerService {

    private final CustomerRepository repository;

    public CustomerService(CustomerRepository repository) {
        this.repository = repository;
    }

    public Customer generateBill(Customer customer) {
        validateReadings(customer);

        customer.setUnitsConsumed(customer.getCurrentReading() - customer.getPreviousReading());
        customer.setBillAmount(calculateBill(customer.getUnitsConsumed()));

        return repository.save(customer);
    }

    public Customer searchCustomer(int customerId) {
        return repository.findById(customerId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Customer not found"));
    }

    public List<Customer> getAllCustomers() {
        return repository.findAll();
    }

    public Customer updateBill(int customerId, Customer updatedCustomer) {
        Customer existing = searchCustomer(customerId);

        if (updatedCustomer.getName() != null && !updatedCustomer.getName().isBlank()) {
            existing.setName(updatedCustomer.getName());
        }

        existing.setPreviousReading(updatedCustomer.getPreviousReading());
        existing.setCurrentReading(updatedCustomer.getCurrentReading());

        validateReadings(existing);

        existing.setUnitsConsumed(existing.getCurrentReading() - existing.getPreviousReading());
        existing.setBillAmount(calculateBill(existing.getUnitsConsumed()));

        return repository.save(existing);
    }

    private void validateReadings(Customer customer) {
        if (customer.getName() == null || customer.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Customer name is required");
        }

        if (customer.getPreviousReading() < 0 || customer.getCurrentReading() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Meter readings cannot be negative");
        }

        if (customer.getCurrentReading() < customer.getPreviousReading()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Current reading cannot be less than previous reading");
        }
    }

    private double calculateBill(double units) {
        if (units <= 100) {
            return units * 2;
        } else if (units <= 200) {
            return 200 + (units - 100) * 3;
        } else if (units <= 400) {
            return 500 + (units - 200) * 5;
        } else {
            return 1500 + (units - 400) * 7;
        }
    }
}
