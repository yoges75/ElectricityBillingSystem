package com.example.electricitybillingsystem.controller;

import com.example.electricitybillingsystem.model.Customer;
import com.example.electricitybillingsystem.service.CustomerService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    private final CustomerService service;

    public CustomerController(CustomerService service) {
        this.service = service;
    }

    @PostMapping("/bill")
    public Customer generateBill(@RequestBody Customer customer) {
        return service.generateBill(customer);
    }

    @GetMapping("/{customerId}")
    public Customer searchCustomer(@PathVariable int customerId) {
        return service.searchCustomer(customerId);
    }

    @GetMapping
    public List<Customer> getAllCustomers() {
        return service.getAllCustomers();
    }

    @PutMapping("/{customerId}/bill")
    public Customer updateBill(@PathVariable int customerId,
                               @RequestBody Customer customer) {
        return service.updateBill(customerId, customer);
    }
}
