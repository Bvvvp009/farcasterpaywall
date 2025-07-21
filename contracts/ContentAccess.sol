// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ContentAccess is ReentrancyGuard, Ownable {
    IERC20 public usdcToken;
    
    uint256 public constant PLATFORM_FEE_BPS = 1000; // 10%
    uint256 public constant BPS_DENOMINATOR = 10000; // 100%
    address public platformFeeCollector;
    
    struct Content {
        address creator;
        uint256 price; // Price in USDC (6 decimals)
        string ipfsCid;
        bool isActive;
        uint256 createdAt;
    }

    struct Payment {
        address payer;
        uint256 amount;
        uint256 creatorAmount;
        uint256 platformFee;
        uint256 timestamp;
        bool isRefunded;
    }

    // Content mappings
    mapping(bytes32 => Content) public contents;
    mapping(address => mapping(bytes32 => bool)) public hasAccess;
    mapping(address => bytes32[]) public userUploads;
    mapping(bytes32 => Payment[]) public contentPayments;
    
    uint256 public totalPlatformFees;
    
    event ContentRegistered(bytes32 indexed contentId, address indexed creator, uint256 price, string ipfsCid);
    event ContentUnlocked(address indexed viewer, bytes32 indexed contentId, uint256 amount, uint256 creatorAmount, uint256 platformFee);
    event ContentDeactivated(bytes32 indexed contentId, address indexed creator);
    event PaymentRefunded(address indexed payer, bytes32 indexed contentId, uint256 amount);
    event PlatformFeeCollected(address indexed collector, uint256 amount);
    event PlatformFeeCollectorUpdated(address indexed oldCollector, address indexed newCollector);
    event PlatformFeesWithdrawn(address indexed to, uint256 amount);

    constructor(address _usdcToken, address _platformFeeCollector) Ownable(msg.sender) {
        usdcToken = IERC20(_usdcToken);
        platformFeeCollector = _platformFeeCollector;
    }

    /**
     * @dev Register new content with USDC price
     * @param contentId Unique identifier for the content
     * @param price Price in USDC (6 decimals)
     * @param ipfsCid IPFS CID where content metadata is stored
     */
    function registerContent(
        bytes32 contentId, 
        uint256 price, 
        string memory ipfsCid
    ) external nonReentrant {
        require(contents[contentId].creator == address(0), "Content already exists");
        require(price > 0, "Price must be greater than 0");
        require(bytes(ipfsCid).length > 0, "IPFS CID cannot be empty");

        contents[contentId] = Content({
            creator: msg.sender,
            price: price,
            ipfsCid: ipfsCid,
            isActive: true,
            createdAt: block.timestamp
        });

        userUploads[msg.sender].push(contentId);
        
        emit ContentRegistered(contentId, msg.sender, price, ipfsCid);
    }

    /**
     * @dev Pay for content access using USDC with platform fees
     * @param contentId Content identifier
     */
    function payForContent(bytes32 contentId) external nonReentrant {
        Content memory content = contents[contentId];
        require(content.creator != address(0), "Content not found");
        require(content.isActive, "Content is not active");
        require(!hasAccess[msg.sender][contentId], "Already has access");
        require(content.price > 0, "Content is free");

        uint256 platformFee = (content.price * PLATFORM_FEE_BPS) / BPS_DENOMINATOR;
        uint256 creatorAmount = content.price - platformFee;

        require(
            usdcToken.transferFrom(msg.sender, address(this), content.price),
            "USDC transfer to contract failed"
        );

        require(
            usdcToken.transfer(content.creator, creatorAmount),
            "USDC transfer to creator failed"
        );

        totalPlatformFees += platformFee;

        hasAccess[msg.sender][contentId] = true;

        contentPayments[contentId].push(Payment({
            payer: msg.sender,
            amount: content.price,
            creatorAmount: creatorAmount,
            platformFee: platformFee,
            timestamp: block.timestamp,
            isRefunded: false
        }));

        emit ContentUnlocked(msg.sender, contentId, content.price, creatorAmount, platformFee);
        emit PlatformFeeCollected(platformFeeCollector, platformFee);
    }

    /**
     * @dev Check if user has access to content
     * @param user User address
     * @param contentId Content identifier
     * @return bool True if user has access
     */
    function checkAccess(address user, bytes32 contentId) external view returns (bool) {
        Content memory content = contents[contentId];
        if (content.creator == address(0) || !content.isActive) {
            return false;
        }

        if (content.creator == user) {
            return true;
        }

        return hasAccess[user][contentId];
    }

    /**
     * @dev Get all content uploaded by a creator
     * @param creator Creator address
     * @return bytes32[] Array of content IDs
     */
    function showUsersUpload(address creator) public view returns (bytes32[] memory) {
        return userUploads[creator];
    }

    /**
     * @dev Get content details
     * @param contentId Content identifier
     * @return Content struct with all details
     */
    function getContent(bytes32 contentId) external view returns (Content memory) {
        return contents[contentId];
    }

    /**
     * @dev Get payment history for content
     * @param contentId Content identifier
     * @return Payment[] Array of payments
     */
    function getContentPayments(bytes32 contentId) external view returns (Payment[] memory) {
        return contentPayments[contentId];
    }

    /**
     * @dev Deactivate content (only creator can do this)
     * @param contentId Content identifier
     */
    function deactivateContent(bytes32 contentId) external {
        Content storage content = contents[contentId];
        require(content.creator == msg.sender, "Only creator can deactivate");
        require(content.isActive, "Content already deactivated");

        content.isActive = false;
        emit ContentDeactivated(contentId, msg.sender);
    }

    /**
     * @dev Update content price (only creator can do this)
     * @param contentId Content identifier
     * @param newPrice New price in USDC
     */
    function updateContentPrice(bytes32 contentId, uint256 newPrice) external {
        Content storage content = contents[contentId];
        require(content.creator == msg.sender, "Only creator can update price");
        require(content.isActive, "Content is not active");
        require(newPrice > 0, "Price must be greater than 0");

        content.price = newPrice;
    }

    /**
     * @dev Update IPFS CID (only creator can do this)
     * @param contentId Content identifier
     * @param newIpfsCid New IPFS CID
     */
    function updateIpfsCid(bytes32 contentId, string memory newIpfsCid) external {
        Content storage content = contents[contentId];
        require(content.creator == msg.sender, "Only creator can update IPFS CID");
        require(content.isActive, "Content is not active");
        require(bytes(newIpfsCid).length > 0, "IPFS CID cannot be empty");

        content.ipfsCid = newIpfsCid;
    }

    /**
     * @dev Get total earnings for a creator (excluding platform fees)
     * @param creator Creator address
     * @return uint256 Total earnings in USDC
     */
    function getCreatorEarnings(address creator) external view returns (uint256) {
        uint256 totalEarnings = 0;
        bytes32[] memory creatorContent = userUploads[creator];
        
        for (uint256 i = 0; i < creatorContent.length; i++) {
            bytes32 contentId = creatorContent[i];
            Payment[] memory payments = contentPayments[contentId];
            
            for (uint256 j = 0; j < payments.length; j++) {
                if (!payments[j].isRefunded) {
                    totalEarnings += payments[j].creatorAmount;
                }
            }
        }
        
        return totalEarnings;
    }

    /**
     * @dev Emergency function to refund payment (only owner)
     * @param contentId Content identifier
     * @param paymentIndex Index of payment to refund
     */
    function emergencyRefund(bytes32 contentId, uint256 paymentIndex) external onlyOwner {
        require(paymentIndex < contentPayments[contentId].length, "Invalid payment index");
        
        Payment storage payment = contentPayments[contentId][paymentIndex];
        require(!payment.isRefunded, "Payment already refunded");

        hasAccess[payment.payer][contentId] = false;

        require(
            usdcToken.transfer(payment.payer, payment.amount),
            "USDC refund failed"
        );

        payment.isRefunded = true;
        emit PaymentRefunded(payment.payer, contentId, payment.amount);
    }

    /**
     * @dev Get content statistics
     * @param contentId Content identifier
     * @return uint256 Total payments, uint256 Active payments, uint256 Total revenue, uint256 Total platform fees
     */
    function getContentStats(bytes32 contentId) external view returns (uint256, uint256, uint256, uint256) {
        Payment[] memory payments = contentPayments[contentId];
        uint256 totalPayments = payments.length;
        uint256 activePayments = 0;
        uint256 totalRevenue = 0;
        uint256 totalPlatformFeesForContent = 0;

        for (uint256 i = 0; i < payments.length; i++) {
            if (!payments[i].isRefunded) {
                activePayments++;
                totalRevenue += payments[i].creatorAmount;
                totalPlatformFeesForContent += payments[i].platformFee;
            }
        }

        return (totalPayments, activePayments, totalRevenue, totalPlatformFeesForContent);
    }

    /**
     * @dev Check if content exists and is active
     * @param contentId Content identifier
     * @return bool True if content exists and is active
     */
    function isContentActive(bytes32 contentId) external view returns (bool) {
        Content memory content = contents[contentId];
        return content.creator != address(0) && content.isActive;
    }

    /**
     * @dev Update platform fee collector (only owner)
     * @param newCollector New platform fee collector address
     */
    function updatePlatformFeeCollector(address newCollector) external onlyOwner {
        require(newCollector != address(0), "Invalid collector address");
        address oldCollector = platformFeeCollector;
        platformFeeCollector = newCollector;
        emit PlatformFeeCollectorUpdated(oldCollector, newCollector);
    }

    /**
     * @dev Withdraw accumulated platform fees to specified address (only owner)
     * @param to Address to withdraw fees to
     * @param amount Amount to withdraw (0 = withdraw all)
     */
    function withdrawPlatformFees(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid recipient address");
        require(amount > 0, "Amount must be greater than 0");
        require(amount <= totalPlatformFees, "Insufficient platform fees");
        require(amount <= usdcToken.balanceOf(address(this)), "Insufficient USDC balance");

        require(
            usdcToken.transfer(to, amount),
            "USDC transfer failed"
        );

        totalPlatformFees -= amount;

        emit PlatformFeesWithdrawn(to, amount);
    }

    /**
     * @dev Withdraw all accumulated platform fees to platform fee collector (only owner)
     */
    function withdrawAllPlatformFees() external onlyOwner {
        uint256 availableFees = usdcToken.balanceOf(address(this));
        require(availableFees > 0, "No platform fees to withdraw");

        uint256 withdrawAmount = availableFees > totalPlatformFees ? totalPlatformFees : availableFees;
        
        require(
            usdcToken.transfer(platformFeeCollector, withdrawAmount),
            "USDC transfer failed"
        );

        totalPlatformFees -= withdrawAmount;

        emit PlatformFeesWithdrawn(platformFeeCollector, withdrawAmount);
    }

    /**
     * @dev Get platform fee for a given amount
     * @param amount Amount in USDC
     * @return uint256 Platform fee amount
     */
    function calculatePlatformFee(uint256 amount) external pure returns (uint256) {
        return (amount * PLATFORM_FEE_BPS) / BPS_DENOMINATOR;
    }

    /**
     * @dev Get creator amount for a given total amount
     * @param amount Total amount in USDC
     * @return uint256 Creator amount (after platform fee)
     */
    function calculateCreatorAmount(uint256 amount) external pure returns (uint256) {
        uint256 platformFee = (amount * PLATFORM_FEE_BPS) / BPS_DENOMINATOR;
        return amount - platformFee;
    }

    /**
     * @dev Get contract's USDC balance
     * @return uint256 Contract's USDC balance
     */
    function getContractBalance() external view returns (uint256) {
        return usdcToken.balanceOf(address(this));
    }

    /**
     * @dev Get available platform fees for withdrawal
     * @return uint256 Available platform fees
     */
    function getAvailablePlatformFees() external view returns (uint256) {
        uint256 contractBalance = usdcToken.balanceOf(address(this));
        return contractBalance > totalPlatformFees ? totalPlatformFees : contractBalance;
    }
} 