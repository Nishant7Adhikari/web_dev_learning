/**
 * Fetches the menu data from the local JSON file.
 * @returns {Promise<Array>} A promise that resolves to the menu data array.
 */
async function fetchMenuData() {
    try {
        const response = await fetch('menu.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Could not fetch menu data:", error);
        return [];
    }
}

/**
 * Updates a user's profile data in the users table.
 * @param {string} userId - The UUID of the user.
 * @param {object} profileData - The data to update (e.g., { name, phone, delivery_address }).
 * @returns {Promise<object>} The updated data.
 */
async function updateUserProfile(userId, profileData) {
    const { data, error } = await supabaseClient
        .from('users')
        .update(profileData)
        .eq('id', userId);
    if (error) {
        console.error('Error updating profile:', error);
        throw error;
    }
    return data;
}

/**
 * Submits a completed order to the product_placement table.
 * @param {object} orderData - The complete order object.
 * @returns {Promise<object>} The result of the submission.
 */
async function submitOrder(orderData) {
    const { data, error } = await supabaseClient
        .from('product_placement')
        .insert([orderData]);
    if (error) {
        console.error('Error submitting order:', error);
        throw error;
    }
    return data;
}

/**
 * Deletes a user from the users table.
 * @param {number} userId - The ID of the user.
 * @returns {Promise<object>} The result of the deletion.
 */
async function deleteUser(userId) {
    const { data, error } = await supabaseClient
        .from('users')
        .delete()
        .eq('id', userId);
    
    if (error) {
        console.error('Error deleting user:', error);
        throw error;
    }
    
    return data;
}