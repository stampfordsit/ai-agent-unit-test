public class UserServiceTests
{
    [Fact]
    public async Task DeleteUserAsync_ShouldReturnFalse_WhenUserDoesNotExist()
    {
        var mockRepo = new Mock<IUserRepository>();

        mockRepo
            .Setup(x => x.GetByIdAsync(1))
            .ReturnsAsync((User?)null);

        var service = new UserService(mockRepo.Object);

        var result = await service.DeleteUserAsync(1);

        Assert.False(result);

        mockRepo.Verify(
            x => x.DeleteAsync(It.IsAny<User>()),
            Times.Never);
    }

    [Fact]
    public async Task DeleteUserAsync_ShouldDeleteUser_WhenUserExists()
    {
        var mockRepo = new Mock<IUserRepository>();

        var user = new User
        {
            Id = 1,
            Name = "John"
        };

        mockRepo
            .Setup(x => x.GetByIdAsync(1))
            .ReturnsAsync(user);

        var service = new UserService(mockRepo.Object);

        var result = await service.DeleteUserAsync(1);

        Assert.True(result);

        mockRepo.Verify(
            x => x.DeleteAsync(user),
            Times.Once);
    }
}