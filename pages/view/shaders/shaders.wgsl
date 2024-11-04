struct TransformData {
    view: mat4x4<f32>,
    projection: mat4x4<f32>,
};
struct ObjectData {
    model: array<mat4x4<f32>>
}

@binding(0) @group(0) var<uniform> transformUBO: TransformData;
@binding(1) @group(0) var<uniform> time: f32;
@binding(2) @group(0) var<storage, read> objects: ObjectData;

struct Fragment {
    @builtin(position) Position: vec4<f32>,
    @location(0) TexCoord: vec2<f32>,
    @location(1) Color: vec3<f32>
};

@vertex
fn vs_main(@builtin(instance_index) ID: u32, @location(0) vertexPostion: vec3<f32>, @location(1) vertexTexCoord: vec2<f32>) -> Fragment {
    var output: Fragment;
    output.Position = transformUBO.projection * transformUBO.view * objects.model[ID] * vec4<f32>(vertexPostion, 1.0);
    output.TexCoord = vertexTexCoord;

    var color: vec3<f32>;

    if ID == 0u {
        color = vec3<f32>(1.0, 0.0, 0.0);
    } else if ID == 1u {
        color = vec3<f32>(0.0, 1.0, 0.0);
    } else if ID == 2u {
        color = vec3<f32>(0.0, 0.0, 1.0);
    } else if ID == 3u {
        color = vec3<f32>(1.0, 1.0, 0.0);
    } else if ID == 4u {
        color = vec3<f32>(1.0, 0.0, 1.0);
    } else if ID == 5u {
        color = vec3<f32>(0.0, 1.0, 1.0);
    } else if ID == 6u {
        color = vec3<f32>(0.5, 0.5, 0.5);
    } else if ID == 7u {
        color = vec3<f32>(1.0, 0.5, 0.0);
    } else if ID == 8u {
        color = vec3<f32>(0.5, 0.0, 0.5);
    } else if ID == 9u {
        color = vec3<f32>(0.0, 0.5, 0.0);
    } else {
        color = vec3<f32>(1.0, 1.0, 1.0);
    }
    // output.Color = vec3<f32>(0.0, 1.0, 0.0);
    output.Color = color;
    return output;
}

@fragment
fn fs_main(@location(0) TexCoord: vec2<f32>, @location(1) Color: vec3<f32>) -> @location(0) vec4<f32> {
    return vec4<f32>(Color, 1.0);
}
